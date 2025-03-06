---
title: Expression Templates in C++
description:
  Expression templates in C++ are a powerful metaprogramming tool. This post covers practical examples and walks through
  basic ideas and implementation approaches.
date: 2025-03-06
---

Not to be confused with `template`, an expression template is an object that represents an expression or computation.

This is a powerful metaprogramming tool because it gives developers complete control over how the computations are
performed. We could evaluate an expression template any time we want, substitute values, inspect it, or evan transform
it. Some common applications of expression templates include lazy evaluation[^wiki], symbolic execution, optimization,
and introducing new semantic meanings to expressions.

[^wiki]:
    The wikipedia page for [expression templates](https://en.wikipedia.org/wiki/Expression_templates) focuses mostly on
    this application but the technique is much more broadly applicable.

To briefly illustrate the concept, a simple expression template representing the expression <nobr>`2 * 3 + 4`</nobr>
could be:

```cpp
template<typename L, typename R>
struct add {
    L lhs;
    R rhs;
};
template<typename L, typename R>
struct mul {
    L lhs;
    R rhs;
};
auto expression_template = add(mul(2, 3), 4);
```

The syntax `add(mul(2, 3), 4)` can be a bit cumbersome and unnatural for expressions[^pn] but with operator overloading
it would be possible to build the same template by using wrapper types for leaf-node terms with syntax along the lines
of `term(2) * 3 + 4` or even a user-defined literal like `2_term * 3 + 4`.

[^pn]:
    Expressions like `add(mul(2, 3), 4)` are effectively [polish notation][pn] (`+ (* 2 3) 4` or `+ * 2 3 4`). I think
    these are really bad for expressibility, however, they're sometimes required in languages that don't have operator
    overloading. Common examples include working with bignum or high-precision arithmetic libraries in languages like C.

[pn]: https://en.wikipedia.org/wiki/Polish_notation

In this blog post I'll briefly go over some examples of how expression templates are used then I will walk through a
implementing a simple expression template that can evaluate an expression with placeholders, such as
`param_1 * param_2 + param_3`. I'll talk about performance and then I'll showcase how expression templates can be used
to add chained comparisons to C++ with the syntax `100_chain <= x <= 200`. Familiarity with C++ fundamentals is
required, however, I have tried to write this in such a way that it is approachable for people with a wide audience.

## Some Applications

Expression templates for lazy evaluation are often useful in the context of linear algebra. For example, we might be
interested in specific components of $\vec{v}_1 + c\vec{v}_2$ or specific elements of a matrix multiplication $AB$. An
expression template can lazily compute these values on the fly as requested instead of doing the full more expensive
computation. It might also be desirable to make decisions about evaluation based on the request and available hardware.
For example, an expression like $(x+y)^Tz$ might be computed on a CPU with a vector addition routine followed by a dot
product routine but on a GPU it could be done with a single kernel handling both operations. An expression template is a
useful way to represent the computation so that that decision can be made. Expression templates could also be used for
more sophisticated optimization or just-in-time compilation.

Bindings for the Z3 theorem prover in many languages use expression templates to allow users to write constraints
naturally instead of potentially cumbersome function calls. For example, the following constructs expression templates
which are passed to Z3's symbolic solver:

```py
x = Int('x')
y = Int('y')
solve(x > 2, y < 10, x + 2 * y == 7)
```

C++20 views are also expression templates and they are evaluated lazily. They are a good example of how expression
templates can be used to introducing new semantics to operations and of how they can be used with different inputs:

```cpp
auto pipeline =
    std::views::filter([] (auto x) { return x % 2 == 0; })
    | std::views::transform([] (auto x) { return x * 5; });
std::vector<int> vec1{1, 2, 3, 4, 5};
std::vector<unsigned> vec2{6, 7, 8, 9, 10};
for(auto x : vec1 | pipeline) {
    std::println("{}", x);
}
for(auto x : vec2 | pipeline) {
    std::println("{}", x);
}
```

[Demo](https://godbolt.org/z/GWP7c3qa5)

Another good example is [Boost.Lambda][bl] which uses expression templates built around placeholders to create a
shorthand lambda syntax:

```cpp
vec | std::views::filter(_1 % 2 == 0)
```

[Demo](https://godbolt.org/z/W5Wbq51z3)

[bl]: https://www.boost.org/doc/libs/1_87_0/doc/html/lambda/le_in_details.html

Expression templates can be used for optimization in a few ways. At an abstract level, various optimization techniques
can be applied to expression trees encoded at compile-time in expression templates. These might be useful to linear
algebra libraries where the compiler might not be able to figure out high-level optimizations on vector and matrix
operations. They might also be useful for various accelerated or parallel computation libraries. Another way expression
templates could be used for optimization is for improving string concatenation in <nobr>C++</nobr>. In <nobr>C++</nobr>,
concatenating a handful of strings like `str1 + str2 + str3 + str4 + str5` results in four temporary strings to be
built, the last one usually being moved to where it is used. This potentially introduces a lot of extra short-lived
allocation and a lot of redundant copying of characters which the compiler is unlikely to optimize away for us. Instead,
if an expression template were built representing the concatenation operation then evaluation code could analyze the
expression tree and allocate a single buffer of size
`str1.size() + str2.size() + str3.size() + str4.size() + str5.size()`.

Lastly, my assertion library, [libassert][libassert], uses expression templates and some macro tricks to save expression
operands, evaluate the full expression, and write out the operands in the event of a failure:

```cpp
int a = 15;
int b = 10;
ASSERT(a < b);
```

```cpp
Assertion failed at demo.cpp:20: int main():
    ASSERT(a < b);
    Where:
        a => 15
        b => 10
```

[libassert]: https://github.com/jeremy-rifkin/libassert

## Implementing a Simple Template

We're going to implement a simple expression template system for expressions with placeholder terms. Our end-goal will
be to support the syntax of `param_1 * param_2 + param_3`.

The first thing we need is a class representing a binary expression. The job of this class is very simple, simply encode
the following expression tree:

<pre class="mermaid">
graph TD
    op
    op --> a
    op --> b
</pre>

Unlike the very start of this article where I used separate class templates `add` and `mul` for the sake of simplicity,
here we're going to use a function object[^fobj] as a template parameter which will encode the operation.

[^fobj]:
    Function objects in C++ are objects that have a call operator. In other words, they can be used like functions.
    Lambdas are the most prevalent use of function templates, these are implemented under the hood as struct types with
    an `operator()`. Function objects are useful for template metaprogramming because they allow functions to be
    represented as types and used along the lines of `F{}(args...)`.

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
};
```

<!-- prettier-ignore -->
> [!NOTE]
> For the sake of simplicity I'm forgoing perfect forwarding here. The types we will be working with in this blog are
> all trivially copyable.

<!-- prettier-ignore -->
> [!NOTE]
> I'll be marking all functions as `cosntexpr` here. This isn't necessary or an optimization, just something we may as
> well do.

We're also going to add a few helper template aliases using function objects from `<functional>`:

```cpp
template<typename L, typename R>
using add = binary_expr<L, R, std::plus<void>>;
template<typename L, typename R>
using mul = binary_expr<L, R, std::multiplies<void>>;
```

We also know we want a handful of special numbered placeholders for parameters. Later during evaluation we are going to
want these placeholders to know their corresponding index at compile time so we'll implement these with a non-type
template parameter:

```cpp
template<std::size_t Index>
struct indexed_parameter {};

constexpr indexed_parameter<0> param_1;
constexpr indexed_parameter<1> param_2;
constexpr indexed_parameter<2> param_3;
```

We can now start to use the function template we've created: `add(mul(param_1, param_2), param_3)` builds an expression
template for us to start to work with (though we can't do anything with it yet).

To achieve the ergonomics we want, `param_1 * param_2 + param_3`, we can add some simple operator overloads:

```cpp
template<typename T>
concept binary_expr_val =
    specialization_of_nttp<T, indexed_parameter>
    || specialization_of<T, binary_expr>;

constexpr auto operator+(binary_expr_val auto lhs, binary_expr_val auto rhs) {
    return add(lhs, rhs);
}

constexpr auto operator*(binary_expr_val auto lhs, binary_expr_val auto rhs) {
    return mul(lhs, rhs);
}
```

<!-- prettier-ignore -->
> [!NOTE]
> Because these are global operator templates it is important to constrain the templates to the types we
> actually handle. `specialization_of` and `specialization_of_nttp` are simple utilities based based on [this
> stackoverflow answer][SO].
>
> <!-- prettier-ignore -->
> ::: details Implementation for `specialization_of` and `specialization_of_nttp`
>
> ```cpp
> // type templates
> template <typename T, template <typename...> class Z>
> struct is_specialization_of : std::false_type {};
>
> template <typename... Args, template <typename...> class Z>
> struct is_specialization_of<Z<Args...>, Z> : std::true_type {};
>
> template <typename T, template <typename...> class Z>
> concept specialization_of = is_specialization_of<T, Z>::value;
>
> // non-type templates
> template <typename T, template <auto...> class Z>
> struct is_specialization_of_nttp : std::false_type {};
>
> template <auto... Args, template <auto...> class Z>
> struct is_specialization_of_nttp<Z<Args...>, Z> : std::true_type {};
>
> template <typename T, template <auto...> class Z>
> concept specialization_of_nttp = is_specialization_of_nttp<T, Z>::value;
> ```
>
> :::

[SO]: https://stackoverflow.com/a/54191646/15675011

The last thing to do is actually evaluate the expression template we've created. We'll want to support the syntax of
`expression.evaluate(a, b, c)` so we'll start with a top-level `auto evaluate(auto&&... args) const` for `binary_expr`.
Evaluation is pretty simple overall, we simply evaluate operands recursively until we hit leaf nodes:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L l, R r) : l(l), r(r) {}
    constexpr auto evaluate(auto&&... args) const { // [!code ++]
        return Op{}(lhs.evaluate(args...), rhs.evaluate(args...)); // [!code ++]
    } // [!code ++]
};
```

This is all we need to do for `binary_expr`. The next step is handling leaf nodes, specifically `indexed_parameter`.
We'll implement a similar `evaluate` method:

```cpp
template<std::size_t Index>
struct indexed_parameter {
    constexpr auto& evaluate(auto&&... args) const { // [!code ++]
        return args...[Index]; // [!code ++]
    } // [!code ++]
};
```

I'm using C++26 [pack indexing][packindex] here which is supported by gcc 15 and clang 19. It's possible to implement
this with template recursion or some tricks with index sequences, fold expressions, and immediately-invoked
lambda-expressions (IILEs), however, for the sake of keeping this blog short it's convenient to use the new feature.

[packindex]: https://en.cppreference.com/w/cpp/language/pack_indexing

And with that we're able to evaluate our simple expression templates with a set of arguments:

```cpp
auto expression = param_1 * param_2 + param_3;
std::cout << expression.evaluate(2, 3, 4); // prints 10
```

[Demo](https://godbolt.org/z/dbednGY4n)

::: details Final Implementation

```cpp
#include <concepts>
#include <cstddef>
#include <functional>
#include <type_traits>

// type templates
template <typename T, template <typename...> class Z>
struct is_specialization_of : std::false_type {};

template <typename... Args, template <typename...> class Z>
struct is_specialization_of<Z<Args...>, Z> : std::true_type {};

template <typename T, template <typename...> class Z>
concept specialization_of = is_specialization_of<T, Z>::value;

// non-type templates
template <typename T, template <auto...> class Z>
struct is_specialization_of_nttp : std::false_type {};

template <auto... Args, template <auto...> class Z>
struct is_specialization_of_nttp<Z<Args...>, Z> : std::true_type {};

template <typename T, template <auto...> class Z>
concept specialization_of_nttp = is_specialization_of_nttp<T, Z>::value;

template<std::size_t Index>
struct indexed_parameter {
    constexpr auto& evaluate(auto&&... args) const {
        return args...[Index];
    }
};

constexpr indexed_parameter<0> param_1;
constexpr indexed_parameter<1> param_2;
constexpr indexed_parameter<2> param_3;

template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    constexpr auto evaluate(auto&&... args) const {
        return Op{}(lhs.evaluate(args...), rhs.evaluate(args...));
    }
};

template<typename L, typename R>
using add = binary_expr<L, R, std::plus<void>>;
template<typename L, typename R>
using mul = binary_expr<L, R, std::multiplies<void>>;

template<typename T>
concept binary_expr_val =
    specialization_of_nttp<T, indexed_parameter>
    || specialization_of<T, binary_expr>;

constexpr auto operator+(binary_expr_val auto lhs, binary_expr_val auto rhs) {
    return add(lhs, rhs);
}

constexpr auto operator*(binary_expr_val auto lhs, binary_expr_val auto rhs) {
    return mul(lhs, rhs);
}
```

:::

<!-- prettier-ignore -->
> [!NOTE]
> This is a very simplified approach expression templates. It has plenty of limitations such as
> not perfectly forwarding and only supporting `indexed_parameter`s as leaf nodes. But, it illustrates the general ideas
> and can be expanded to support more functionality with relative ease.

### Performance

We've implemented a simple expression template but how does it perform? Even this simple expression template requires a
lot of objects to be constructed, functions to be called, and arguments to be passed around.

However, despite all of this, it turns out that this ends up being a zero-overhead abstraction. Looking at the following
example in Compiler Explorer we find that we get instruction-for-instruction identical codegen with the expression
template as if we did the same operation without the template:

```cpp
int foo(int a, int b, int c) {
    auto expression = param_1 * param_2 + param_3;
    return expression.evaluate(a, b, c);
}

int bar(int a, int b, int c) {
    return a * b + c;
}
```

```asm
foo(int, int, int):
        imul    edi, esi
        lea     eax, [rdi + rdx]
        ret

bar(int, int, int):
        imul    edi, esi
        lea     eax, [rdi + rdx]
        ret
```

[Demo](https://godbolt.org/z/j1G7E7ej8)

Additionally, for the `expression.evaluate(2, 3, 4)` demo in the previous section you may have noticed the instruction
`mov esi, 10` before the call to `operator<<`. This is the compiler passing `10` directly to the function which means
the compiler constant-propagated the computation `expression.evaluate(2, 3, 4)` at compile-time for us.

## Chained Comparisons

Many languages, notably Python, support chained comparison such as `100 <= x <= 200` with the meaning
`100 <= x && x <= 200`. This functionality can provide a few main benefits: It can avoid repetition and bugs associated
with repetition, it would allow C++ fold expressions to work with comparisons (e.g. `(args <= ...)`), and it is more
natural interpretation of the expression than the C and C++ interpretation of `(100 <= x) <= 200`, which is legal but
won't do what many users expect[^footgun]. In recent years, there have been efforts to add support for chained
comparisons to C++ [[P0893]](https://wg21.link/P0893) [[P3439]](https://wg21.link/P3439), however, it is yet to be seen
if it will become part of the language.

[^footgun]:
    Attempting to write a chained comparison like `100 <= x <= 200` can be a common footgun for novice C and C++
    programmers.

In this section we'll explore using expression templates to do chained comparisons in C++. We can't make the syntax
`100 <= x <= 200` magically work as we have to build the expression template somehow, but, we can get close with wrapper
types that have operator overloads. One way to do this could look like `chain(100) <= chain(x) <= chain(200)`, but, we
can do better. In an expression like `100 <= x <= 200`, it's sufficient to place wrap just a single leaf node in the
expression tree: `chain(100) <= x <= 200`. Overloaded operators will build the expression tree all the way up. We'll
also support a user-defined literal to make the syntax even more minimal: `100_chain <= x <= 200`. We'll support
chaining six comparison operators `<=`, `<`, `==`, `!=`, `>=`, and `>`, including across precedence levels like treating
`chain(100) <= x == y <= chain(200)` as `100 <= x && x == y && y <= 200`.

<!-- prettier-ignore -->
> [!NOTE]
> Because of operator precedence an expression like `100 <= x == y <= 200` parses as `(100 <= x) == (y <= 200)` and we
> will have to use more than one `chain()` wrapper to ensure the whole expression is built up as an expression
> template.

<!-- prettier-ignore -->
> [!NOTE]
> [[P3439]](https://wg21.link/P3439) proposes only changing unparenthesized chains of comparisons while leaving
> expressions such as `(a <= b) <= c` unchanged. I think this is a very reasonable and sensible approach. But, we won't
> be able to achieve quite the same semantics as there is no way for our expression templates to detect parentheses in
> such expressions.

We'll use a similar approach to what we used in the previous section. The main difference is that we won't use a special
`indexed_parameter` type and instead we'll store values directly. Once again, I am going to forgo perfect forwarding for
the sake of simplicity. We'll start with the same `binary_expr` class we used in the previous section:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
};
```

And we'll also add similar aliases but this time for comparison operations:

```cpp
template<typename L, typename R>
using less_equal = binary_expr<L, R, std::less_equal<void>>;
// lots more ...
```

We'll also again add a set of operator overloads for our expression template:

```cpp
template<typename L, typename R>
concept can_chain = specialization_of<L, binary_expr> || specialization_of<R, binary_expr>;

template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator<=(L lhs, R rhs) {
    return less_equal(lhs, rhs);
}
// lots more...
```

Again, it is important to constrain these overloads. In this case I've made a helper concept `can_chain` that enables
the operator overloads if either the left or right hand operands are `binary_expr`s.

We could use this now with syntax along the lines of `less_equal(100, x) <= 200`, however, this looks a bit funny and
inconsistent and it's not ergonomic. In order to support the syntax `chain(100) <= x <= 200` we'll use a helper struct
to wrap a value and kick-start the expression template building.

```cpp
template<typename T>
struct chain {
    T wrapped_value;
};
```

We'll also have to update our `can_chain` concept to support this new wrapper:

```cpp
template<typename T> // [!code ++]
concept chainable = specialization_of<T, binary_expr> || specialization_of<T, chain>; // [!code ++]
template<typename L, typename R>
concept can_chain = specialization_of<L, binary_expr> || specialization_of<R, binary_expr>; // [!code --]
concept can_chain = chainable<L> || chainable<R>; // [!code ++]
```

Now we can build our expression template with the syntax `chain(a) <= b <= c`. The last step is to implement evaluation.
To do this, we'll define an `operator bool` on our expression template that will evaluate it when requested:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    constexpr operator bool() const { // [!code ++]
        ... // [!code ++]
    } // [!code ++]
};
```

If this `binary_expr` had normal semantics it would be very simple to implement: We could simply
`return Op{}(lhs, rhs);` and call it a day. However, because we want to provide chaining semantics we'll have to do some
extra logic. Additionally, because we store not just `binary_expr`s and values we also store `chain` wrappers we need to
do a little extra work to unwrap the value if needed. I'm going to add a helper `maybe_unwrap` for this and attempt to
unwrap operands right away for evaluation to make things easier for us:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    template<typename T> // [!code ++]
    constexpr auto& maybe_unwrap(const chain<T>& value) const { // [!code ++]
        return value.wrapped_value; // [!code ++]
    } // [!code ++]
    template<typename T> // [!code ++]
    constexpr auto& maybe_unwrap(const T& value) const { // [!code ++]
        return value; // [!code ++]
    } // [!code ++]
    constexpr operator bool() const {
        auto& lhs = maybe_unwrap(this->lhs); // [!code ++]
        auto& rhs = maybe_unwrap(this->rhs); // [!code ++]
        ...
    }
};
```

<!-- prettier-ignore -->
> [!NOTE]
> Naming is hard so I'm reusing (and shadowing) `lhs` and `rhs`.

To evaluate a given `binary_expr` there are four cases to consider:

1. Both the left-hand and right-hand operand are `binary_expr`s
2. The right-hand operand is a `binary_expr` but the left-hand isn't
3. The left-hand operand is a `binary_expr` but the right-hand isn't
4. Neither are `binary_expr`

Let's consider an expression template representing `a <= b <= c == d <= e <= f`. This expression has a parse tree of:

<pre class="mermaid">
graph TD
    eq["=="]
    lt1["<="]
    lt2["<="]
    lt3["<="]
    lt4["<="]
    eq --> lt1
    eq --> lt3
    lt1 --> lt2
    lt2 --> a
    lt2 --> b
    lt1 --> c
    lt3 --> lt4
    lt3 --> f
    lt4 --> d
    lt4 --> e
</pre>

We'll start with considering a `binary_expr` representing the root `==` in the expression. It has to do two things: It
has to check `c == d` and it has to check the rest of the chained expression. Checking `c == d` requires us to
recursively walk the expression tree in order to find the right-most node in the left-hand sub-tree (`c`) and the
left-most node in the right-hand sub-tree (`d`).

We'll add two helper functions for this:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    constexpr auto& get_left_most() const { // [!code ++]
        if constexpr(specialization_of<L, binary_expr>) { // [!code ++]
            return lhs.get_left_most(); // [!code ++]
        } else { // [!code ++]
            return lhs; // [!code ++]
        } // [!code ++]
    } // [!code ++]
    constexpr auto& get_right_most() const { // [!code ++]
        if constexpr(specialization_of<R, binary_expr>) { // [!code ++]
            return rhs.get_right_most(); // [!code ++]
        } else { // [!code ++]
            return rhs; // [!code ++]
        } // [!code ++]
    } // [!code ++]
    template<typename T>
    constexpr auto& maybe_unwrap(const chain<T>& value) const { ... }
    template<typename T>
    constexpr auto& maybe_unwrap(const T& value) const { ... }
    constexpr operator bool() const { ... }
};
```

With these helpers, evaluating `c == d` is a matter of checking `Op{}(lhs.get_right_most(), rhs.get_left_most())`.

To check the rest of the chained expression we'll take advantage of a chained `a <= b <= c == d <= e <= f` being
equivalent to `(a <= b <= c) && c == d && (d <= e <= f)`. The `lhs` and `rhs` for the `binary_expr` for `==` are these
chained sub-expressions we're interested in already, `a <= b <= c` and `d <= e <= f` respectively. In addition to
computing `c == d` all we have to do is simply evaluate the `lhs` and `rhs` if they are binary expressions:

```cpp
template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    constexpr auto& get_left_most() const { ... }
    constexpr auto& get_right_most() const { ... }
    template<typename T>
    constexpr auto& maybe_unwrap(const chain<T>& value) const { ... }
    template<typename T>
    constexpr auto& maybe_unwrap(const T& value) const { ... }
    constexpr operator bool() const {
        auto& lhs = maybe_unwrap(this->lhs);
        auto& rhs = maybe_unwrap(this->rhs);
        if constexpr(specialization_of<L, binary_expr> && specialization_of<R, binary_expr>) { // [!code ++]
            return lhs && Op{}(lhs.get_right_most(), rhs.get_left_most()) && rhs; // [!code ++]
        } // [!code ++]
    }
};
```

This is case one from earlier: Both `lhs` and `rhs` are `binary_expr`s. Cases two and three fall out naturally from
this, we simply evaluate the `lhs` or `rhs` only if they are `binary_expr`s. Case four is the simplest, we just evaluate
`Op{}(lhs, rhs)`.

```cpp
    constexpr operator bool() const {
        auto& lhs = maybe_unwrap(this->lhs);
        auto& rhs = maybe_unwrap(this->rhs);
        if constexpr(specialization_of<L, binary_expr> && specialization_of<R, binary_expr>) {
            return lhs && Op{}(lhs.get_right_most(), rhs.get_left_most()) && rhs;
        } else if constexpr(!specialization_of<L, binary_expr> && specialization_of<R, binary_expr>) { // [!code ++]
            return Op{}(lhs, rhs.get_left_most()) && rhs; // [!code ++]
        } else if constexpr(specialization_of<L, binary_expr> && !specialization_of<R, binary_expr>) { // [!code ++]
            return lhs && Op{}(lhs.get_right_most(), rhs); // [!code ++]
        } else { // [!code ++]
            return Op{}(lhs, rhs); // [!code ++]
        } // [!code ++]
    }
```

And with that we can evaluate our expression template as a chained comparison:

```cpp
int x = 150;
std::cout
    << std::boolalpha
    << (chain(100) <= x <= 200); // prints true
```

[Demo](https://godbolt.org/z/KqM3jE4e3)

::: details Final Implementation

```cpp
#include <concepts>
#include <cstddef>
#include <functional>
#include <type_traits>

template <typename T, template <typename...> class Z>
struct is_specialization_of : std::false_type {};

template <typename... Args, template <typename...> class Z>
struct is_specialization_of<Z<Args...>, Z> : std::true_type {};

template <typename T, template <typename...> class Z>
concept specialization_of = is_specialization_of<T, Z>::value;

template<typename T>
struct chain {
    T wrapped_value;
};

template<typename L, typename R, typename Op>
class binary_expr {
    L lhs;
    R rhs;
public:
    constexpr binary_expr(L lhs, R rhs) : lhs(lhs), rhs(rhs) {}
    constexpr auto& get_left_most() const {
        if constexpr(specialization_of<L, binary_expr>) {
            return lhs.get_left_most();
        } else {
            return lhs;
        }
    }
    constexpr auto& get_right_most() const {
        if constexpr(specialization_of<R, binary_expr>) {
            return rhs.get_right_most();
        } else {
            return rhs;
        }
    }
    template<typename T>
    constexpr auto& maybe_unwrap(const chain<T>& value) const {
        return value.wrapped_value;
    }
    template<typename T>
    constexpr auto& maybe_unwrap(const T& value) const {
        return value;
    }
    constexpr operator bool() const {
        auto& lhs = maybe_unwrap(this->lhs);
        auto& rhs = maybe_unwrap(this->rhs);
        if constexpr(specialization_of<L, binary_expr> && specialization_of<R, binary_expr>) {
            return lhs && Op{}(lhs.get_right_most(), rhs.get_left_most()) && rhs;
        } else if constexpr(!specialization_of<L, binary_expr> && specialization_of<R, binary_expr>) {
            return Op{}(lhs, rhs.get_left_most()) && rhs;
        } else if constexpr(specialization_of<L, binary_expr> && !specialization_of<R, binary_expr>) {
            return lhs && Op{}(lhs.get_right_most(), rhs);
        } else {
            return Op{}(lhs, rhs);
        }
    }
};

template<typename L, typename R>
using equal_to = binary_expr<L, R, std::equal_to<void>>;
template<typename L, typename R>
using not_equal_to = binary_expr<L, R, std::not_equal_to<void>>;
template<typename L, typename R>
using greater = binary_expr<L, R, std::greater<void>>;
template<typename L, typename R>
using less = binary_expr<L, R, std::less<void>>;
template<typename L, typename R>
using greater_equal = binary_expr<L, R, std::greater_equal<void>>;
template<typename L, typename R>
using less_equal = binary_expr<L, R, std::less_equal<void>>;

template<typename T>
concept chainable = specialization_of<T, binary_expr> || specialization_of<T, chain>;
template<typename L, typename R>
concept can_chain = chainable<L> || chainable<R>;

template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator==(L lhs, R rhs) {
    return equal_to(lhs, rhs);
}
template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator!=(L lhs, R rhs) {
    return not_equal_to(lhs, rhs);
}
template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator>(L lhs, R rhs) {
    return greater(lhs, rhs);
}
template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator<(L lhs, R rhs) {
    return less(lhs, rhs);
}
template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator>=(L lhs, R rhs) {
    return greater_equal(lhs, rhs);
}
template<typename L, typename R> requires(can_chain<L, R>)
constexpr auto operator<=(L lhs, R rhs) {
    return less_equal(lhs, rhs);
}
```

:::

### Syntax Sugar

The syntax `chain(100) <= x <= 200` is pretty good but we can make this a little more minimal for terms with literal
values by using a user-defined literal (UDL)[^udl]: `100_chain <= x <= 200`.

[^udl]: These were added in C++11 though they have seemed to become increasingly popular in recent years.

We could implement a simple UDL with the following:

```cpp
constexpr auto operator ""_chain(unsigned long long value) {
    return chain(value);
}
```

However, this runs into a limitation: The argument for an integer UDL value has to be an `unsigned long long` and thus
here we return a `chain<unsigned long long>`. That would cause promotions in our comparison that we might not want.
Additionally, it could introduce signed-unsigned comparisons in an expression which could be
problematic[^signedunsigned].

[^signedunsigned]:
    Comparisons between signed and unsigned integers are a footgun in C++ (e.g. `1u < -1` evaluates to `true`), but,
    this happens to be another great use of expression templates! An expression template could be made that always
    evaluates comparisons with sign safety, e.g. with `std::cmp_less` etc. My assertion library, [libassert][libassert],
    used to do this by default.

There are a handful of ways to proceed here and cleaver tricks that can be used depending on goals but for the sake of
this blog post I'll simply update the UDL to return the value as a wrapped `int`:

```cpp{2}
constexpr auto operator ""_chain(unsigned long long value) {
    return chain(static_cast<int>(value));
}
```

[Demo](https://godbolt.org/z/8865s5h53)

### Fold Expressions

[[P3439]](https://wg21.link/P3439) highlights fold expressions as a motivating example for chained comparisons. Since we
have made a tool to do chained comparison, let try it out for this application.

::: info

Fold expressions are a way to perform an operation on a pack of values. For example, if we had a function
`add(auto&&... values)` we could implement this as:

```cpp
constexpr auto add(auto&&... values) {
    return (values + ...);
}
```

For an input like `add(1, 2, 3, 4)` this expands to `return (1 + (2 + (3 + 4)));`.

:::

Let's make a function `is_sorted` that checkes if the pack of arguments are in sorted order. We can use a pack like
`(args <= ...)` to create an expression and then we'll use `chain()` to make the fold expression build an expression
template:

```cpp
constexpr bool is_sorted(auto&&... args) {
    return (chain(args) <= ...);
}
```

The easiest way to test this is a handful of static asserts:

```cpp
static_assert(is_sorted(1, 2, 3, 3, 4, 5));
static_assert(!is_sorted(1, 2, 3, 4, 3, 5));
static_assert(!is_sorted(1, 2, 3, 3, 3, 1));
static_assert(!is_sorted(1, 4, 5, 1, 2, 3));
```

[Demo](https://godbolt.org/z/j6dro79o9)

### Performance

Once again, we have an elaborate setup that involves a lot of objects and function calls and template metaprogramming.
None the less, compilers are good at optimizing transforming away superfluous computation.

A simple chained comparison such as `chain(a) <= b <= c` generates as efficient assembly as we'd expect. Clang ends up
producing assembly identical to that of `a <= b && b <= c` (and gcc's is identical too other than register names):

```asm
        cmp     edi, esi
        setle   cl
        cmp     esi, edx
        setle   al
        and     al, cl
        ret
```

::: details `chain(a) <= b <= c` vs `a <= b && b <= c` codegen on clang

```cpp
bool foo(int a, int b, int c) {
    return chain(a) <= b <= c;
}

bool bar(int a, int b, int c) {
    return a <= b && b <= c;
}
```

```asm
foo(int, int, int):
        cmp     edi, esi
        setle   cl
        cmp     esi, edx
        setle   al
        and     al, cl
        ret

bar(int, int, int):
        cmp     edi, esi
        setle   cl
        cmp     esi, edx
        setle   al
        and     al, cl
        ret
```

:::

[Compiler Explorer](https://godbolt.org/z/vPPK831Gq)

Now let's look at more complex example:

```cpp
bool foo(int a, int b, int c, int d, int e, int f) {
    return chain(a) <= b <= c == chain(d) <= e <= f;
}

bool bar(int a, int b, int c, int d, int e, int f) {
    return a <= b && b <= c && c == d && d <= e && e <= f;
}
```

The code generated by gcc and clang for the two functions are close but not quite identical:
[Compiler Explorer](https://godbolt.org/z/G1x7Ea68T).

Due to complexities of modern hardware (pipelining, superscalar execution, branch prediction, micro-architecture
details, etc.) eyeballing x86 is impossible[^x86] and in general the only way to know for sure how something performs is
to benchmark it. But, none the less, let's first look at some superficial eyeball metrics as a way of summarizing the
high-level differences and similarities:

|       | instructions (gcc) | instructions (clang) | branch (gcc) | branch (clang) | comparisons (gcc) | comparisons (clang) |
| ----- | ------------------ | -------------------- | ------------ | -------------- | ----------------- | ------------------- |
| `foo` | 18                 | 17                   | no           | yes            | 5                 | 5                   |
| `bar` | 15                 | 15                   | yes          | no             | 5                 | 5                   |

Overall, fairly similar but with minor differences. Whether or not branching is beneficial here will come down to the
likelihood of the condition being branched on. In both cases, `bar` uses slightly fewer instructions for both compilers.
Whether or not this makes a difference will come down to port allocation, register dependencies, latencies, etc. One
observation is that gcc's generation for `foo` is three instructions longer than `bar` and that comes down to three
`mov`s it has that `bar` does not. That being said, this doesn't necessarily make it slower because of register renaming
on x86 can make `mov`s can effectively free.

We can use tools like llvm-mca or [uiCA][uica] to do more sophisticated analysis and approximation of instruction
performance on x86: [Compiler Explorer](https://godbolt.org/z/rvj9Ee896). Here, llvm-mca estimates about 500 cycles for
100 iterations of `bar` and about 540-600 cycles for 100 iterations of `foo`, depending on the compiler[^mov].

[^x86]: But that doesn't stop people from trying!

[^mov]:
    Interestingly, llvm-mca seems to be allocating register pressure to the `mov`s that I hoped would end up being
    register-renamed.

[uica]: https://uica.uops.info/

<!-- prettier-ignore -->
> [!NOTE]
> Tools like llvm-mca and uiCA don't model branch prediction and assume the instruction are queued in order regardless
> of branches.

This simulated difference isn't insignificant so it's worth investigating.

<!-- prettier-ignore -->
> [!WARNING]
> This blog post is about to dive into some fairly technical compiler internals.

#### Inspecting The Optimizer

To begin figuring out what's going on here we can look at the optimization pass viewer on Compiler Explorer to inspect
how clang (really LLVM[^llvm]) is optimizing the two functions: [Demo](https://godbolt.org/z/3EhT1jvME). I'm going to
focus on clang in this section because LLVM, in my experience, has better tooling for studying optimization passes. The
story for gcc is similar.

[^llvm]:
    Both clang and LLVM are part of the LLVM project but "clang" generally refers to the C and C++ front-end while LLVM
    handles the middle and back-end of compilation (optimization in intermediate representations and final machine code
    generation).

First looking at `bar`, clang relatively early transforms this into something that is almost optimized. If you aren't
familiar with LLVM's internal representation (IR) that is ok, the important thing to see here is that the instructions
are a series of comparisons (`icmp`s) then branches (`br`s) which originate from the short-circuiting behavior of `&&`
in C++. I've also added some comments to explain what is being computed:

```llvm
define dso_local noundef zeroext i1 @bar(int, int, int, int, int, int)(i32 noundef %a, i32 noundef %b, i32 noundef %c, i32 noundef %d, i32 noundef %e, i32 noundef %f) {
entry:
  %cmp = icmp sle i32 %a, %b ; a <= b
  br i1 %cmp, label %land.lhs.true, label %land.end ; "if the comparison is true continue, else go to the return block and return false"
land.lhs.true:
  %cmp1 = icmp sle i32 %b, %c ; b <= c
  br i1 %cmp1, label %land.lhs.true2, label %land.end ; "if the comparison is true continue, else go to the return block and return false"
land.lhs.true2:
  %cmp3 = icmp eq i32 %c, %d ; c == d
  br i1 %cmp3, label %land.lhs.true4, label %land.end ; "if the comparison is true continue, else go to the return block and return false"
land.lhs.true4:
  %cmp5 = icmp sle i32 %d, %e ; d <= e
  br i1 %cmp5, label %land.rhs, label %land.end ; "if the comparison is true continue, else go to the return block and return false"
land.rhs:
  %cmp6 = icmp sle i32 %e, %f ; e <= f
  br label %land.end ; "jump to the return block and return the value of this comparison"
land.end:                                         ; preds = %land.rhs, %land.lhs.true4, %land.lhs.true2, %land.lhs.true, %entry
  %0 = phi i1 [ false, %land.lhs.true4 ], [ false, %land.lhs.true2 ], [ false, %land.lhs.true ], [ false, %entry ], [ %cmp6, %land.rhs ]
  ret i1 %0
}
```

A later pass then removes these branches to produce a chain of comparisons and boolean operations:

```llvm
define dso_local noundef zeroext i1 @bar(int, int, int, int, int, int)(i32 noundef %a, i32 noundef %b, i32 noundef %c, i32 noundef %d, i32 noundef %e, i32 noundef %f) local_unnamed_addr {
entry:
  %cmp.not = icmp sgt i32 %a, %b
  %cmp1.not = icmp sgt i32 %b, %c
  %or.cond = or i1 %cmp.not, %cmp1.not
  %or.cond.not = xor i1 %or.cond, true
  %cmp3 = icmp eq i32 %c, %d
  %or.cond11 = and i1 %or.cond.not, %cmp3
  %or.cond11.not = xor i1 %or.cond11, true
  %cmp5.not = icmp sgt i32 %d, %e
  %or.cond12 = or i1 %or.cond11.not, %cmp5.not
  %cmp6 = icmp sle i32 %e, %f
  %spec.select = select i1 %or.cond12, i1 false, i1 %cmp6
  ret i1 %spec.select
}
```

Optimizing `foo` takes a lot more work: We have built up a lot of complex objects and we have a lot of function calls.
LLVM has to do a few passes including inlining and peephole optimizations to combine instructions in order to massage
the function down to something fairly optimal:

```llvm
define dso_local noundef zeroext i1 @foo(int, int, int, int, int, int)(i32 noundef %a, i32 noundef %b, i32 noundef %c, i32 noundef %d, i32 noundef %e, i32 noundef %f) local_unnamed_addr #0 personality ptr @__gxx_personality_v0 {
entry:
  %cmp.i.i.i.i.i = icmp sle i32 %a, %b ; a <= b
  %cmp.i.i.i.i = icmp sle i32 %b, %c ; b <= c
  %0 = and i1 %cmp.i.i.i.i.i, %cmp.i.i.i.i ; a <= b && b <= c
  %cmp.i.i.i = icmp eq i32 %c, %d ; c == d
  %or.cond.i = and i1 %0, %cmp.i.i.i ; (a <= b && b <= c) && c == d
  br i1 %or.cond.i, label %land.rhs.i, label %exit
land.rhs.i:
  %cmp.i.i.i.i17.i = icmp sle i32 %c, %e ; c <= e
  %cmp.i.i.i18.i = icmp sle i32 %e, %f ; e <= f
  %1 = and i1 %cmp.i.i.i.i17.i, %cmp.i.i.i18.i ; c <= e && e <= f
  br label %exit
exit: ; preds = %entry, %land.rhs.i
  %2 = phi i1 [ false, %entry ], [ %1, %land.rhs.i ]
  ret i1 %2
}
```

Visually, this has a different structure. Instead of a series of comparisons and branches or a direct series of
comparisons and boolean operations we are greeted with a middle state of two branches each with a series of comparisons
and boolean operations. LLVM doesn't further transform this function even though we know it could be further transformed
in theory.

The difference in codegen comes down to how we got here: Inlining vs starting with a simple sequence of comparisons and
branches. Because of how LLVM _orders_ its passes, code for the `binary_expr` evaluating `a <= b && b <= c` and
`c <= e && e <= f` had already been optimized by the time they were inlined into the `binary_expr` computing the root
`.. && c == d && ..`. This created the middle state where the two sub-expression evaluations had been optimized out of
branch form but the root `.. && c == d && ..` had not. As a result, LLVM wasn't able to transform the full evaluation
into the non-branching version as easily.

In short, this is a result of pass ordering[^po].

[^po]: Pass ordering for optimizing compilers is a notoriously difficult problem.

To prove the theory I'm going to manually tell LLVM what order to run optimization passes in. This takes a couple of
careful steps:

1. I'm going to use Compiler Explorer to dump the _unoptimized_ LLVM IR for `foo`:
   [CE](https://godbolt.org/z/4YExhsndj). It's also important to turn off demangling here since we're going to feed this
   IR into another tool parsing the IR.
2. Switching the language on compiler explorer to LLVM I'm going to feed the IR into `opt`, which is an LLVM tool to run
   optimization passes on LLVM IR and output the resulting LLVM IR. Instead of passing `-O3` or similar, I'm explicitly
   going to tell LLVM the order I want it to run passes in. Specifically, I want LLVM to inline functions first before
   absolutely anything else. After that, SROA (transforming stack-based loads and stores to registers), InstCombine
   (instruction peephole optimization), and SimplifyCFG are sufficient for LLVM to optimize our expression template. We
   can tell `opt` to do this with `-passes=inline,sroa,instcombine,simplifycfg`: [CE](https://godbolt.org/z/qKK7xdEs5).

The LLVM IR we get as a result is pretty well optimized!

```llvm
define dso_local noundef zeroext i1 @_Z3fooiiiiii(i32 noundef %a, i32 noundef %b, i32 noundef %c, i32 noundef %d, i32 noundef %e, i32 noundef %f) personality ptr @__gxx_personality_v0 {
  %cmp.i.i.i.not.i.i = icmp sgt i32 %a, %b
  %cmp.i.i.i.i.not = icmp sgt i32 %b, %c
  %or.cond = or i1 %cmp.i.i.i.not.i.i, %cmp.i.i.i.i.not
  %or.cond.not = xor i1 %or.cond, true
  %cmp.i.i.i = icmp eq i32 %c, %d
  %or.cond10 = and i1 %or.cond.not, %cmp.i.i.i
  %or.cond10.not = xor i1 %or.cond10, true
  %cmp.i.i.i.not.i3.i = icmp sgt i32 %d, %e
  %or.cond11 = or i1 %or.cond10.not, %cmp.i.i.i.not.i3.i
  %cmp.i.i.i7.i = icmp sle i32 %e, %f
  %spec.select = select i1 %or.cond11, i1 false, i1 %cmp.i.i.i7.i
  ret i1 %spec.select
}
```

In fact, it looks so similar to the optimized LLVM IR we dumped for `bar` that it's worth doing a side-by-side
comparison (I've cleaned up long lines to make it fit):

<table style="display: table; width: 100%; table-layout: fixed;">
<thead>
<tr>
<th>
Expression template
</th>
<th>
Manually chained
</th>
</tr>
</thead>
<tbody>
<tr>
<td>

```llvm
define i1 @foo(...) {
  %t1 = icmp sgt i32 %a, %b
  %t2 = icmp sgt i32 %b, %c
  %t3 = or i1 %t1, %t2
  %t4 = xor i1 %t3, true
  %t5 = icmp eq i32 %c, %d
  %t6 = and i1 %t4, %t5
  %t7 = xor i1 %t6, true
  %t8 = icmp sgt i32 %d, %e
  %t9 = or i1 %t7, %t8
  %t10 = icmp sle i32 %e, %f
  %t11 = select i1 %t9,
            i1 false,
            i1 %t10
  ret i1 %t11
}
```

</td>
<td>

```llvm
define i1 @bar(...) {
  %t1 = icmp sgt i32 %a, %b
  %t2 = icmp sgt i32 %b, %c
  %t3 = or i1 %t1, %t2
  %t4 = xor i1 %t3, true
  %t5 = icmp eq i32 %c, %d
  %t6 = and i1 %t4, %t5
  %t7 = xor i1 %t6, true
  %t8 = icmp sgt i32 %d, %e
  %t9 = or i1 %t7, %t8
  %t10 = icmp sle i32 %e, %f
  %t11 = select i1 %t9,
            i1 false,
            i1 %t10
  ret i1 %spec.select
}
```

</td>
</tr>
</tbody>
</table>

And would you look at that! It's the same, IR instruction for IR instruction!

With this understanding we can create a much simpler example showing where the difference originates:

```cpp
static bool abc(int a, int b, int c) {
    return a <= b && b <= c;
}
static bool def(int d, int e, int f) {
    return d <= e && e <= f;
}
bool foo(int a, int b, int c, int d, int e, int f) {
    return abc(a, b, c) && c == d && def(d, e, f);
}
bool bar(int a, int b, int c, int d, int e, int f) {
    return a <= b && b <= c && c == d && d <= e && e <= f;
}

```

<!-- prettier-ignore -->
> [!NOTE]
> I'm using `static` here to give functions internal linkage so they don't show up in the output assembly after being
> inlined.

[Compiler Explorer](https://godbolt.org/z/vrPT4fMh5)

Here, `foo` and `bar` are clearly equivalent and clearly have no overhead but the generated machine code very closely
matches the differences we saw when we first started looking at the more elaborate comparison example.

::: info Key takeaway

Small differences in optimization order can have far-reaching and surprising indirect consequences.

:::

Overall, this isn't a result of overhead from the expression template and this also isn't necessarily a deficiency in
LLVM or a problem with the compiler's pass ordering. It's a simple consequence of small differences in the order of
transformation precluding some optimization opportunities (or maybe making others possible). Effort could be put into
adding pass logic for compilers to optimize code like this, however, it's not entirely clear how best to generate an
expression like this. Simply trying to remove all branches, for example, could make things faster or slower depending on
likelihoods.

## Conclusion

Expression templates are very useful and extremely powerful metaprogramming tool that are applicable for a wide range of
uses. Implementing expression templates can be fairly simple and they can be written in such a way that they don't add
run-time overhead. I hope this has been interesting in one form or another. Cheers!
