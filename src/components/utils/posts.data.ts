import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";

// Based on https://github.dev/sfxcode/vitepress-blog-starter

export type PostData = {
    path: string;
    title: string;
    date: Date;
};

function get_post_data(file: string): PostData & { draft: boolean } {
    const contents = fs.readFileSync(`src/posts/${file}`, "utf-8");
    const frontmatter = fm<Record<string, string | Date | number | boolean>>(contents);
    return {
        path: file.replace(/\.md$/g, ""),
        title: frontmatter.attributes.title as string,
        date: new Date(frontmatter.attributes.date as Date),
        draft: frontmatter.attributes.draft as boolean,
    };
}

declare const data: PostData[];
export { data };

function load(): PostData[] {
    return fs
        .readdirSync("src/posts/")
        .filter(
            file => file.endsWith(".md") && file !== "index.md" && (process.env.MODE !== "prod" || file !== "test.md"),
        )
        .map(file => {
            console.log(file);
            return file;
        })
        .map(get_post_data)
        .filter(post => !post.draft)
        .map(({ path, title, date }) => ({ path, title, date }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default {
    watch: path.join("src/posts/", "*.md"),
    load,
};
