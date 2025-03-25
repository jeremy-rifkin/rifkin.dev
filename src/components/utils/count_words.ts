import { MarkdownRenderer } from "vitepress";

type Token = ReturnType<MarkdownRenderer["parse"]>[0];

// TODO:
// Decide how to count spoiler blocks
// Decide how to count code blocks

const non_text_tokens = ["fence", "code_inline", "html_block", "html_inline", "math_inline", "emoji"];

export function count_words(tokens: Token[]) {
    let count = 0;
    for (const token of tokens) {
        if (token.content === "") {
            if (token.content) {
                throw new Error(`Token had content when it shouldn't have: Type = ${token.type}:\n${token}`);
            }
        } else if (non_text_tokens.includes(token.type)) {
            // pass
        } else if (token.type === "inline") {
            if (token.children === null) {
                throw new Error(`Token had no children when it shouldn't have: Type = ${token.type}:\n${token}`);
            }
            count += count_words(token.children);
        } else if (token.type === "text" || token.type === "nobr") {
            count += token.content.trim().split(/\s+/).length;
        } else {
            throw new Error(`Unknown token in count_words: Type = ${token.type}:\n${token}`);
        }
    }
    return count;
}
