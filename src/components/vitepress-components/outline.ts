import { getScrollOffset, Header, onContentUpdated } from "vitepress";
import type { DefaultTheme } from "vitepress/theme";
import { onMounted, onUnmounted, onUpdated, type Ref } from "vue";
import { throttleAndDebounce } from "./utils";

const ignoreRE = /\b(?:VPBadge|header-anchor|footnote-ref|ignore-header)\b/;

// cached list of anchor elements from resolveHeaders
const resolvedHeaders: { element: HTMLHeadElement; link: string }[] = [];

export type MenuItem = Omit<Header, "slug" | "children"> & {
    element: HTMLHeadElement;
    children?: MenuItem[];
};

export function resolveTitle(theme: DefaultTheme.Config): string {
    return (
        (typeof theme.outline === "object" && !Array.isArray(theme.outline) && theme.outline.label) ||
        theme.outlineTitle ||
        "Contents"
    );
}

export function getHeaders(range: DefaultTheme.Config["outline"]): MenuItem[] {
    const headers = [...document.querySelectorAll("#post-content :where(h1,h2,h3,h4,h5,h6)")]
        .filter(el => el.id && el.hasChildNodes())
        .map(el => {
            const level = Number(el.tagName[1]);
            return {
                element: el as HTMLHeadElement,
                title: serializeHeader(el),
                link: "#" + el.id,
                level,
            };
        });

    return resolveHeaders(headers, range);
}

function serializeHeader(h: Element): string {
    let ret = "";
    for (const node of h.childNodes) {
        if (node.nodeType === 1) {
            if (ignoreRE.test((node as Element).className)) continue;
            ret += node.textContent;
        } else if (node.nodeType === 3) {
            ret += node.textContent;
        }
    }
    return ret.trim();
}

export function resolveHeaders(headers: MenuItem[], range?: DefaultTheme.Config["outline"]): MenuItem[] {
    if (range === false) {
        return [];
    }

    //   const levelsRange =
    //     (typeof range === 'object' && !Array.isArray(range)
    //       ? range.level
    //       : range) || 2

    //   const [high, low]: [number, number] =
    //     typeof levelsRange === 'number'
    //       ? [levelsRange, levelsRange]
    //       : levelsRange === 'deep'
    //         ? [2, 6]
    //         : levelsRange

    //   return buildTree(headers, high, low)
    return buildTree(headers, 2, 3);
    // return buildTree(headers, 1, 1);
}

export function useActiveAnchor(container: Ref<HTMLElement>, marker: Ref<HTMLElement>): void {
    const onScroll = throttleAndDebounce(setActiveLink, 100);

    let prevActiveLink: HTMLAnchorElement | null = null;

    let minSticky = 172;
    const sticky = () => {
        if (window.scrollY <= minSticky) {
            container.value.style.top = minSticky - window.scrollY + "px";
        } else {
            container.value.style.top = "";
        }
    };
    onContentUpdated(() => {
        const contentOffsetTop = document.getElementById("content")?.offsetTop;
        const postTitleOffsetTop = document.getElementById("post-title")?.offsetTop;
        // console.log(contentOffsetTop, postTitleOffsetTop);
        if (contentOffsetTop !== undefined && postTitleOffsetTop !== undefined) {
            minSticky = contentOffsetTop + postTitleOffsetTop;
        }
        // console.log(minSticky);
        sticky();
    });

    onMounted(() => {
        requestAnimationFrame(setActiveLink);
        window.addEventListener("scroll", onScroll);
        window.addEventListener("scroll", sticky);
    });

    onUpdated(() => {
        // sidebar update means a route change
        activateLink(location.hash);
    });

    onUnmounted(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", sticky);
    });

    function setActiveLink() {
        const scrollY = window.scrollY;
        const innerHeight = window.innerHeight;
        const offsetHeight = document.body.offsetHeight;
        const isBottom = Math.abs(scrollY + innerHeight - offsetHeight) < 1;

        // resolvedHeaders may be repositioned, hidden or fix positioned
        const headers = resolvedHeaders
            .map(({ element, link }) => ({
                link,
                top: getAbsoluteTop(element),
            }))
            .filter(({ top }) => !Number.isNaN(top))
            .sort((a, b) => a.top - b.top);

        // no headers available for active link
        if (!headers.length) {
            activateLink(null);
            return;
        }

        // page top
        if (scrollY < 1) {
            activateLink(null);
            return;
        }

        // page bottom - highlight last link
        if (isBottom) {
            activateLink(headers[headers.length - 1].link);
            return;
        }

        // find the last header above the top of viewport
        let activeLink: string | null = null;
        for (const { link, top } of headers) {
            if (top > scrollY + getScrollOffset() + 4) {
                break;
            }
            activeLink = link;
        }
        activateLink(activeLink);
    }

    function activateLink(hash: string | null) {
        if (prevActiveLink) {
            prevActiveLink.classList.remove("active");
        }

        if (hash == null) {
            prevActiveLink = null;
        } else {
            prevActiveLink = container.value.querySelector(`a[href="${decodeURIComponent(hash)}"]`);
        }

        const activeLink = prevActiveLink;

        // const firstLink = resolvedHeaders[0].link;
        // const firstLinkOffsetTop = (container.value.querySelector(`a[href="${decodeURIComponent(firstLink)}"]`) as HTMLElement | null)?.offsetTop;

        if (activeLink) {
            activeLink.classList.add("active");
            marker.value.style.top = activeLink.offsetTop + "px";
            marker.value.style.height = activeLink.clientHeight + "px";
            marker.value.style.opacity = "1";
        } else {
            marker.value.style.top = "33px";
            marker.value.style.opacity = "0";
        }
    }
}

function getAbsoluteTop(element: HTMLElement): number {
    let offsetTop = 0;
    while (element !== document.body) {
        if (element === null) {
            // child element is:
            // - not attached to the DOM (display: none)
            // - set to fixed position (not scrollable)
            // - body or html element (null offsetParent)
            return NaN;
        }
        offsetTop += element.offsetTop;
        element = element.offsetParent as HTMLElement;
    }
    return offsetTop;
}

function buildTree(data: MenuItem[], min: number, max: number): MenuItem[] {
    resolvedHeaders.length = 0;

    const result: MenuItem[] = [];
    const stack: (MenuItem | { level: number; shouldIgnore: true })[] = [];

    data.forEach(item => {
        const node = { ...item, children: [] };
        let parent = stack[stack.length - 1];

        while (parent && parent.level >= node.level) {
            stack.pop();
            parent = stack[stack.length - 1];
        }

        if (node.element.classList.contains("ignore-header") || (parent && "shouldIgnore" in parent)) {
            stack.push({ level: node.level, shouldIgnore: true });
            return;
        }

        if (node.level > max || node.level < min) return;
        resolvedHeaders.push({ element: node.element, link: node.link });

        if (parent) parent.children!.push(node);
        else result.push(node);

        stack.push(node);
    });

    return result;
}
