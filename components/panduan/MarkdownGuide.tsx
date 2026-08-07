import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 border-b border-gold/15 pb-2 font-display text-xl font-semibold text-slate-900">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-display text-lg font-semibold text-slate-800">{children}</h3>
  ),
  p: ({ children }) => <p className="mt-3 text-sm leading-relaxed text-slate-600">{children}</p>,
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  hr: () => <hr className="my-8 border-gold/15" />,
  a: ({ href, children }) => {
    const className = "font-medium text-gold-dark underline decoration-gold/40 underline-offset-2 hover:decoration-gold";
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-gold/15">
      <table className="min-w-full divide-y divide-gold/10 text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-gold/10 bg-white">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 font-semibold text-slate-700">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-slate-600">{children}</td>,
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{children}</code>
  ),
};

export function MarkdownGuide({ content }: { content: string }) {
  return (
    <article className="max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
