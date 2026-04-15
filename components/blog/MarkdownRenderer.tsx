import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="blog-prose font-sans text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-12 mb-6 font-display text-4xl font-black uppercase tracking-tight text-ink">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 mb-4 font-display text-2xl font-black uppercase tracking-wide text-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-3 font-display text-xl font-bold uppercase tracking-wide text-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-5 text-[17px] leading-[1.7] text-ink">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-semibold text-accent-brand underline underline-offset-4 decoration-2 hover:decoration-4"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-5 ml-6 list-disc space-y-2 text-[17px] leading-[1.7] text-ink marker:text-accent-brand">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 ml-6 list-decimal space-y-2 text-[17px] leading-[1.7] text-ink marker:font-bold marker:text-accent-brand">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-[4px] border-accent-brand bg-bg-muted-warm py-3 pl-5 pr-4 font-display italic text-ink">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...rest }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code
                  {...rest}
                  className="rounded border-[2px] border-ink bg-bg-muted-warm px-1.5 py-0.5 font-mono text-[0.9em] text-ink"
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                {...rest}
                className={`${className ?? ''} font-mono text-[14px]`}
              >
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto border-[3px] border-ink bg-ink p-4 text-bg-warm shadow-[5px_5px_0_var(--color-accent-brand)]">
              {children}
            </pre>
          ),
          img: ({ src, alt }) =>
            typeof src === 'string' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ''}
                className="my-6 w-full border-[3px] border-ink shadow-[5px_5px_0_#2C2B2B]"
              />
            ) : null,
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto border-[3px] border-ink">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-[2px] border-ink bg-ink px-4 py-2 text-left font-display text-xs font-black uppercase tracking-wider text-bg-warm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-[2px] border-ink px-4 py-2 text-[15px]">
              {children}
            </td>
          ),
          hr: () => <hr className="my-10 border-t-[3px] border-ink" />,
          strong: ({ children }) => (
            <strong className="font-bold text-ink">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
