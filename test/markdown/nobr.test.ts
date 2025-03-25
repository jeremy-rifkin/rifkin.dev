import { describe, expect, test } from 'vitest';
import MarkdownIt from "markdown-it";
import { nobr_plugin } from '../../src/components/markdown/nobr-plugin';
import { reduce } from './utils';

describe("nobr tests", () => {
    test("basic", () => {
        const md = MarkdownIt();
        md.use(nobr_plugin);
        const result = md.parse('test c++ test', {});
        expect(reduce(result)).to.deep.equal([
            {
              "children": null,
              "content": "",
              "type": "paragraph_open",
            },
            {
              "children": [
                {
                  "children": null,
                  "content": "test ",
                  "type": "text",
                },
                {
                  "children": null,
                  "content": "c++",
                  "type": "nobr",
                },
                {
                  "children": null,
                  "content": " test",
                  "type": "text",
                },
              ],
              "content": "test c++ test",
              "type": "inline",
            },
            {
              "children": null,
              "content": "",
              "type": "paragraph_close",
            },
          ]);
    });
    test("more elaborate", () => {
        const md = MarkdownIt();
        md.use(nobr_plugin);
        const result = md.parse('Test c++ test testc++ c++test', {});
        expect(reduce(result)).to.deep.equal([
            {
              "children": null,
              "content": "",
              "type": "paragraph_open",
            },
            {
              "children": [
                {
                  "children": null,
                  "content": "Test ",
                  "type": "text",
                },
                {
                  "children": null,
                  "content": "c++",
                  "type": "nobr",
                },
                {
                  "children": null,
                  "content": " test ",
                  "type": "text",
                },
                {
                  "children": null,
                  "content": "testc++",
                  "type": "nobr",
                },
                {
                  "children": null,
                  "content": " ",
                  "type": "text",
                },
                {
                  "children": null,
                  "content": "c++test",
                  "type": "nobr",
                },
              ],
              "content": "Test c++ test testc++ c++test",
              "type": "inline",
            },
            {
              "children": null,
              "content": "",
              "type": "paragraph_close",
            },
          ]);
    });
});
