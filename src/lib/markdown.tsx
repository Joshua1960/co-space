import React from "react";

// Simple markdown parser for card descriptions
// Supports: **bold**, *italic*, `code`, [links](url), - lists, # headers

export const parseMarkdown = (text: string): string => {
  if (!text) return "";

  let html = text;

  // Escape HTML first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (must be at start of line)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-sm font-semibold text-slate-900 mt-3 mb-1">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-base font-semibold text-slate-900 mt-4 mb-2">$1</h2>',
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h1>',
  );

  // Bold
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold">$1</strong>',
  );

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Code (inline)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>',
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-slate-600">$1</li>');
  html = html.replace(
    /(<li.*<\/li>\n?)+/g,
    '<ul class="list-disc list-inside space-y-1">$&</ul>',
  );

  // Line breaks
  html = html.replace(/\n/g, "<br />");

  return html;
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const html = parseMarkdown(content);
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
