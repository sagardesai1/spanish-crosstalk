import fs from "fs";
import path from "path";

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
};

export type BlogPost = BlogPostMeta & {
  body: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) {
    return { meta: {}, body: raw.trim() };
  }
  const end = raw.indexOf("---", 3);
  if (end === -1) return { meta: {}, body: raw.trim() };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 3).trim();
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body };
}

export function listBlogPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { meta } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title ?? slug,
        description: meta.description ?? "",
        date: meta.date ?? "",
        tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getBlogPost(slug: string): BlogPost | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? "",
    date: meta.date ?? "",
    tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    body,
  };
}
