import type { MetadataRoute } from "next";
import { listBlogPosts } from "@/lib/blog";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://spanish-crosstalk.vercel.app").replace(
  /\/$/,
  "",
);

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const posts = listBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/signin`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...posts,
  ];
}
