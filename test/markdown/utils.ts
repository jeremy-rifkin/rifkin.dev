import { Token } from 'markdown-it/index.js';

export function reduce(tokens: Token[] | null) {
    if(tokens === null) {
        return null;
    }
    return tokens.map(({type, content, children}) => ({type, content, children: reduce(children)}));
}
