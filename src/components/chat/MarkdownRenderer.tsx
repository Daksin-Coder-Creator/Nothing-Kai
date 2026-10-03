import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ExternalLink, Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = React.useMemo(() => {
    const langKey = (language || '').toLowerCase();
    const grammar = Prism.languages[langKey] || Prism.languages[language] || Prism.languages.javascript || Prism.languages.markup;
    try {
      return Prism.highlight(value, grammar, language || 'javascript');
    } catch (e) {
      return value;
    }
  }, [value, language]);

  return (
    <div className="my-4 rounded-xl overflow-hidden bg-[#121212] border border-white/10 shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#1a1a1e] border-b border-white/5 text-[11px] font-mono text-zinc-400">
        <span className="text-white font-semibold uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
          title="Copy Code Snippet"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Block</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed bg-[#0b0b0d]">
        <pre className="scrollbar-thin">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
};

const MarkdownRendererBase: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Pre-process text to handle common math delimiters and entities
  const processedText = React.useMemo(() => {
    return content
      .replace(/&dollar;/g, '$')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\\\[/g, '$$')
      .replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$');
  }, [content]);

  return (
    <div className={`markdown-body prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <p className="my-1.5 leading-relaxed" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-lg font-extrabold text-white mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-2.5 mb-1" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-gray-200" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-white/20 pl-4 py-1 my-3 bg-white/5 rounded-r-lg italic text-gray-400" {...props} />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !className;
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-rose-400 font-mono text-[0.9em]" {...props}>
                  {children}
                </code>
              );
            }
            const codeString = String(children).replace(/\n$/, '');
            return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
          },
          img: ({ node, src, alt, ...props }: any) => (
            <div className="my-4 flex justify-center">
              <img 
                src={src} 
                alt={alt} 
                className="max-w-full rounded-xl border border-white/10 shadow-xl max-h-[500px] object-contain"
                referrerPolicy="no-referrer"
                {...props}
              />
            </div>
          ),
          a: ({ node, href, children, ...props }: any) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-4 transition-colors inline-flex items-center gap-1"
              {...props}
            >
              {children}
              <ExternalLink className="w-3 h-3" />
            </a>
          ),
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

export const MarkdownRenderer = React.memo(MarkdownRendererBase);
