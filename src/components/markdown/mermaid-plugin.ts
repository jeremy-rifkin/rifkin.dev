import assert from "assert";
import MarkdownIt from "markdown-it";

export const mermaid_plugin = (md: MarkdownIt) => {
    const fence = md.renderer.rules.fence;
    assert(fence);
    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const fence_token = tokens[idx];
        assert(fence_token.children === null);
        if(fence_token.info === "mermaid") {
            return `<pre class="mermaid">${fence_token.content}</pre>`
        } else {
            return fence(tokens, idx, options, env, self);
        }
    };
};
