import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownBody({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--foreground)] sm:text-3xl">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-8 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--foreground)]">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mt-4 text-base leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
        ),
        table: ({ children }) => (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm sm:text-base">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-[var(--level-border)] text-[var(--muted)]">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-semibold text-[var(--foreground)]">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-b border-[var(--panel-border)] px-3 py-2 align-top text-[var(--foreground)]/90">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mt-6 border-l-2 border-[var(--accent)] pl-4 text-[var(--muted)]">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
