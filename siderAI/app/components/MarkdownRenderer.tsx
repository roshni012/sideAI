'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        code(props: any) {
          const { inline, className, children } = props;

          if (inline) {
            return (
              <code
                style={{
                  background: '#eee',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
              >
                {children}
              </code>
            );
          }

          return (
            <pre
              style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '6px',
                overflowX: 'auto',
              }}
            >
              <code className={className}>{children}</code>
            </pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}