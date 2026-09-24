import type { Metadata } from "next";
import Link from "next/link";
import { listBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides on beginner Spanish conversation practice, comprehensible input, and Crosstalk with Mateo.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--foreground)]"
        >
          Spanish Crosstalk
        </Link>
        <Link
          href="/signin?next=%2Fpractice"
          className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          Practice
        </Link>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Practical guides for English speakers who want Spanish conversation practice that starts
          with listening, not drills.
        </p>

        {posts.length === 0 ? (
          <p className="mt-12 text-[var(--muted)]">No posts yet. Check back soon.</p>
        ) : (
          <ul className="mt-12 space-y-10">
            {posts.map((post) => (
              <li key={post.slug}>
                <article>
                  <p className="text-sm text-[var(--muted)]">{post.date}</p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-[var(--accent)]"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.description ? (
                    <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">
                      {post.description}
                    </p>
                  ) : null}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    Read guide
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
