import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getBlogPost, listBlogPosts } from "@/lib/blog";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://spanish-crosstalk.vercel.app"
).replace(/\/$/, "");

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      siteName: "Spanish Crosstalk",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function buildJsonLd(post: NonNullable<ReturnType<typeof getBlogPost>>) {
  const url = `${siteUrl}/blog/${post.slug}`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Spanish Crosstalk",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Spanish Crosstalk",
      url: siteUrl,
    },
    mainEntityOfPage: url,
    image:
      "https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?auto=format&fit=crop&w=1200&q=80",
  };

  const faqMatches = [
    ...post.body.matchAll(/### (.+)\n\n([\s\S]*?)(?=\n### |\n## |$)/g),
  ].filter((m) => {
    const faqStart = post.body.indexOf("## FAQs");
    return faqStart !== -1 && post.body.indexOf(m[0]) > faqStart;
  });

  const faq =
    faqMatches.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqMatches.map((m) => ({
            "@type": "Question",
            name: m[1].trim(),
            acceptedAnswer: {
              "@type": "Answer",
              text: m[2].trim().replace(/\n+/g, " ").slice(0, 500),
            },
          })),
        }
      : null;

  return faq ? [article, faq] : [article];
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = buildJsonLd(post);

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--foreground)]"
        >
          Spanish Crosstalk
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/blog" className="text-[var(--muted)] underline-offset-2 hover:underline">
            Blog
          </Link>
          <Link
            href="/signin?next=%2Fpractice"
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            Practice
          </Link>
        </nav>
      </header>

      <article className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8">
        <p className="text-sm text-[var(--muted)]">
          <time dateTime={post.date}>{post.date}</time>
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.description ? (
          <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{post.description}</p>
        ) : null}

        <div className="mt-10 border-t border-[var(--panel-border)] pt-2">
          <MarkdownBody content={post.body} />
        </div>

        <div className="mt-16 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-6 py-8 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
            Try a Crosstalk session with Mateo
          </h2>
          <p className="mt-2 text-base leading-relaxed text-[var(--muted)]">
            Speak English, hear Spanish back. Start with your free daily minutes on Spanish
            Crosstalk.
          </p>
          <Link
            href="/signin?next=%2Fpractice"
            className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Start free practice
          </Link>
        </div>
      </article>
    </main>
  );
}
