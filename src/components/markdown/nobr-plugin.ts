import assert from "assert";
import MarkdownIt from "markdown-it";
import { Token } from "markdown-it/index.js";
import StateCore from "markdown-it/lib/rules_core/state_core.mjs";

// based on markdown-it-emoji

const word_chars = "[\\p{Alphabetic}\\p{Number}\\p{Connector_Punctuation}\\p{Join_Control}]*"
export const cpp_re = new RegExp(`${word_chars}c\\+\\+${word_chars}`, "iu");
export const cpp_re_global = new RegExp(cpp_re.source, "giu");

function splitTextToken(text: string, level: number, Token: StateCore["Token"]) {
    let last_pos = 0;
    const nodes: Token[] = [];

    for(const {0: match, index} of text.matchAll(cpp_re_global)) {
        // Add new tokens to pending list
        if (index > last_pos) {
            const token = new Token("text", "", 0);
            token.content = text.slice(last_pos, index);
            nodes.push(token);
        }

        const token = new Token("nobr", "", 0);
        token.markup = "";
        token.content = match;
        nodes.push(token);

        last_pos = index + match.length;
    }

    if (last_pos < text.length) {
        const token = new Token("text", "", 0);
        token.content = text.slice(last_pos);
        nodes.push(token);
    }

    return nodes;
}

export const nobr_plugin = (md: MarkdownIt) => {
    md.renderer.rules.nobr = function (tokens, idx /*, options, env */) {
        return `<nobr>${tokens[idx].content}</nobr>`;
    };
    md.core.ruler.after("linkify", "nobr", function(state) {
        const blockTokens = state.tokens;
        for (let j = 0, l = blockTokens.length; j < l; j++) {
            if (blockTokens[j].type !== "inline") {
                continue;
            }
            let tokens = blockTokens[j].children;
            assert(tokens);
            // scan from end to keep position when tokens are added
            for (let i = tokens.length - 1; i >= 0; i--) {
                const token: Token = tokens[i];
                if (token.type === "text" && cpp_re.test(token.content)) {
                    // replace current node
                    blockTokens[j].children = tokens = md.utils.arrayReplaceAt(
                        tokens,
                        i,
                        splitTextToken(token.content, token.level, state.Token),
                    );
                }
            }
        }
    });
};
