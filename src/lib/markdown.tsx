import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  const markdownComponents: Record<string, any> = {
    a: ({ ...props }: any) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      />
    ),
    code: ({ inline, children, ...props }: any) => {
      if (inline) {
        return (
          <code
            className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <pre className="bg-slate-900 text-white p-4 rounded-xl overflow-x-auto text-sm">
          <code {...props}>{children}</code>
        </pre>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold text-slate-900 mt-4 mb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-semibold text-slate-900 mt-3 mb-1">
        {children}
      </h3>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-1 text-slate-600">
        {children}
      </ul>
    ),
    li: ({ children }: any) => <li>{children}</li>,
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
