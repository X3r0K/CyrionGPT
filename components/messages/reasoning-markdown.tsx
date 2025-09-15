import React from 'react';
import { Streamdown } from 'streamdown';

const components = {
  a: (
    props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      children?: React.ReactNode;
    },
  ) => {
    const { children, href, ...rest } = props;
    return typeof children === 'string' && /^\d+$/.test(children) ? (
      <a
        href={href}
        title={href}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-foreground/20 hover:bg-foreground/30 ml-1 inline-flex size-[16px] items-center justify-center rounded-full text-[10px] no-underline"
        {...rest}
      >
        {children}
      </a>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  },
  p: (props: { children?: React.ReactNode }) => (
    <p className="mb-2 whitespace-pre-wrap text-sm last:mb-0">
      {props.children}
    </p>
  ),
} as const;

export const ReasoningMarkdown: React.FC<{ content: string }> = ({
  content,
}) => {
  return (
    <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 w-[60vw] min-w-full space-y-6 break-words text-sm md:w-full">
      <Streamdown components={components}>{content}</Streamdown>
    </div>
  );
};
