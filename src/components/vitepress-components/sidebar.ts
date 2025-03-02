import { useMediaQuery } from "@vueuse/core";
import type { DefaultTheme } from "vitepress/theme";
import {
    computed,
    onMounted,
    onUnmounted,
    ref,
    watch,
    watchEffect,
    watchPostEffect,
    type ComputedRef,
    type Ref,
} from "vue";
import { useData } from "vitepress";
import { ensureStartingSlash, isActive } from "./utils";
// import {
//   hasActiveLink as containsActiveLink,
//   getSidebar,
//   getSidebarGroups
// } from './sidebar'

const containsActiveLink = hasActiveLink;

export interface SidebarLink {
    text: string;
    link: string;
    docFooterText?: string;
}

type SidebarItem = DefaultTheme.SidebarItem;

/**
 * Get the `Sidebar` from sidebar option. This method will ensure to get correct
 * sidebar config from `MultiSideBarConfig` with various path combinations such
 * as matching `guide/` and `/guide/`. If no matching config was found, it will
 * return empty array.
 */
export function getSidebar(_sidebar: DefaultTheme.Sidebar | undefined, path: string): SidebarItem[] {
    if (Array.isArray(_sidebar)) return addBase(_sidebar);
    if (_sidebar == null) return [];

    path = ensureStartingSlash(path);

    const dir = Object.keys(_sidebar)
        .sort((a, b) => {
            return b.split("/").length - a.split("/").length;
        })
        .find(dir => {
            // make sure the multi sidebar key starts with slash too
            return path.startsWith(ensureStartingSlash(dir));
        });

    const sidebar = dir ? _sidebar[dir] : [];
    return Array.isArray(sidebar) ? addBase(sidebar) : addBase(sidebar.items, sidebar.base);
}

/**
 * Get or generate sidebar group from the given sidebar items.
 */
export function getSidebarGroups(sidebar: SidebarItem[]): SidebarItem[] {
    const groups: SidebarItem[] = [];

    let lastGroupIndex: number = 0;

    for (const index in sidebar) {
        const item = sidebar[index];

        if (item.items) {
            lastGroupIndex = groups.push(item);
            continue;
        }

        if (!groups[lastGroupIndex]) {
            groups.push({ items: [] });
        }

        groups[lastGroupIndex]!.items!.push(item);
    }

    return groups;
}

export function getFlatSideBarLinks(sidebar: SidebarItem[]): SidebarLink[] {
    const links: SidebarLink[] = [];

    function recursivelyExtractLinks(items: SidebarItem[]) {
        for (const item of items) {
            if (item.text && item.link) {
                links.push({
                    text: item.text,
                    link: item.link,
                    docFooterText: item.docFooterText,
                });
            }

            if (item.items) {
                recursivelyExtractLinks(item.items);
            }
        }
    }

    recursivelyExtractLinks(sidebar);

    return links;
}

/**
 * Check if the given sidebar item contains any active link.
 */
export function hasActiveLink(path: string, items: SidebarItem | SidebarItem[]): boolean {
    if (Array.isArray(items)) {
        return items.some(item => hasActiveLink(path, item));
    }

    return isActive(path, items.link) ? true : items.items ? hasActiveLink(path, items.items) : false;
}

function addBase(items: SidebarItem[], _base?: string): SidebarItem[] {
    return [...items].map(_item => {
        const item = { ..._item };
        const base = item.base || _base;
        if (base && item.link) item.link = base + item.link;
        if (item.items) item.items = addBase(item.items, base);
        return item;
    });
}

export interface SidebarControl {
    collapsed: Ref<boolean>;
    collapsible: ComputedRef<boolean>;
    isLink: ComputedRef<boolean>;
    isActiveLink: Ref<boolean>;
    hasActiveLink: ComputedRef<boolean>;
    hasChildren: ComputedRef<boolean>;
    toggle(): void;
}

export function useSidebar() {
    const { frontmatter, page, theme } = useData();
    const is960 = useMediaQuery("(min-width: 960px)");

    const isOpen = ref(false);

    const _sidebar = computed(() => {
        const sidebarConfig = theme.value.sidebar;
        const relativePath = page.value.relativePath;
        return sidebarConfig ? getSidebar(sidebarConfig, relativePath) : [];
    });

    const sidebar = ref(_sidebar.value);

    watch(_sidebar, (next, prev) => {
        if (JSON.stringify(next) !== JSON.stringify(prev)) sidebar.value = _sidebar.value;
    });

    const hasSidebar = computed(() => {
        return frontmatter.value.sidebar !== false && sidebar.value.length > 0 && frontmatter.value.layout !== "home";
    });

    const leftAside = computed(() => {
        if (hasAside)
            return frontmatter.value.aside == null ? theme.value.aside === "left" : frontmatter.value.aside === "left";
        return false;
    });

    const hasAside = computed(() => {
        if (frontmatter.value.layout === "home") return false;
        if (frontmatter.value.aside != null) return !!frontmatter.value.aside;
        return theme.value.aside !== false;
    });

    const isSidebarEnabled = computed(() => hasSidebar.value && is960.value);

    const sidebarGroups = computed(() => {
        return hasSidebar.value ? getSidebarGroups(sidebar.value) : [];
    });

    function open() {
        isOpen.value = true;
    }

    function close() {
        isOpen.value = false;
    }

    function toggle() {
        isOpen.value ? close() : open();
    }

    return {
        isOpen,
        sidebar,
        sidebarGroups,
        hasSidebar,
        hasAside,
        leftAside,
        isSidebarEnabled,
        open,
        close,
        toggle,
    };
}

/**
 * a11y: cache the element that opened the Sidebar (the menu button) then
 * focus that button again when Menu is closed with Escape key.
 */
export function useCloseSidebarOnEscape(isOpen: Ref<boolean>, close: () => void) {
    let triggerElement: HTMLButtonElement | undefined;

    watchEffect(() => {
        triggerElement = isOpen.value ? (document.activeElement as HTMLButtonElement) : undefined;
    });

    onMounted(() => {
        window.addEventListener("keyup", onEscape);
    });

    onUnmounted(() => {
        window.removeEventListener("keyup", onEscape);
    });

    function onEscape(e: KeyboardEvent) {
        if (e.key === "Escape" && isOpen.value) {
            close();
            triggerElement?.focus();
        }
    }
}

export function useSidebarControl(item: ComputedRef<DefaultTheme.SidebarItem>): SidebarControl {
    const { page, hash } = useData();

    const collapsed = ref(false);

    const collapsible = computed(() => {
        return item.value.collapsed != null;
    });

    const isLink = computed(() => {
        return !!item.value.link;
    });

    const isActiveLink = ref(false);
    const updateIsActiveLink = () => {
        isActiveLink.value = isActive(page.value.relativePath, item.value.link);
    };

    watch([page, item, hash], updateIsActiveLink);
    onMounted(updateIsActiveLink);

    const hasActiveLink = computed(() => {
        if (isActiveLink.value) {
            return true;
        }

        return item.value.items ? containsActiveLink(page.value.relativePath, item.value.items) : false;
    });

    const hasChildren = computed(() => {
        return !!(item.value.items && item.value.items.length);
    });

    watchEffect(() => {
        collapsed.value = !!(collapsible.value && item.value.collapsed);
    });

    watchPostEffect(() => {
        (isActiveLink.value || hasActiveLink.value) && (collapsed.value = false);
    });

    function toggle() {
        if (collapsible.value) {
            collapsed.value = !collapsed.value;
        }
    }

    return {
        collapsed,
        collapsible,
        isLink,
        isActiveLink,
        hasActiveLink,
        hasChildren,
        toggle,
    };
}
