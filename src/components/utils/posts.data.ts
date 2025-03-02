import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";

// Based on https://github.dev/sfxcode/vitepress-blog-starter

export type PostData = {
    path: string;
    title: string;
    date: Date;
};

function get_post_data(file: string): PostData {
    const contents = fs.readFileSync(`src/posts/${file}`, "utf-8");
    const frontmatter = fm<Record<string, string>>(contents);
    return { path: file, title: frontmatter.attributes.title, date: new Date(frontmatter.attributes.date) };
}

declare const data: PostData[];
export { data };

function load(): PostData[] {
    return fs
        .readdirSync("src/posts/")
        .filter(file => file.endsWith(".md") && file !== "index.md")
        .map(file => {
            console.log(file);
            return file;
        })
        .map(get_post_data)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default {
    watch: path.join("posts/", "*.md"),
    load,
};
