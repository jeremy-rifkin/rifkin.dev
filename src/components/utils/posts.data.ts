import fs from "node:fs";
import path from "node:path";
import fm from "front-matter";

// Based on https://github.dev/sfxcode/vitepress-blog-starter

export type PostData = {
    path: string;
    title: string;
    date: Date;
};

function get_post_data(path: string): PostData & { draft: boolean } {
    const contents = fs.readFileSync(`src/blog/${path}`, "utf-8");
    const frontmatter = fm<Record<string, string | Date | number | boolean>>(contents);
    return {
        path: path.replace(/\.md$/g, ""),
        title: frontmatter.attributes.title as string,
        date: new Date(frontmatter.attributes.date as Date),
        draft: (frontmatter.attributes.draft as boolean) || path.startsWith("drafts/"),
    };
}

declare const data: PostData[];
export { data };

function load(): PostData[] {
    return (
        fs
            .readdirSync("src/blog/", { encoding: "utf-8", recursive: true })
            .filter(path => !fs.statSync(`src/blog/${path}`).isDirectory())
            .map(path => path.replaceAll("\\", "/"))
            .filter(
                path =>
                    path.endsWith(".md") && path !== "index.md" && (process.env.MODE !== "prod" || path !== "test.md"),
            )
            // .map(path => {
            //     console.log(path);
            //     return path;
            // })
            .map(get_post_data)
            .filter(post => !post.draft)
            .map(({ path, title, date }) => ({ path, title, date }))
            .sort((a, b) => b.date.getTime() - a.date.getTime())
    );
}

export default {
    watch: path.join("src/blog/", "*.md"),
    load,
};
