import React, { type FC, memo } from 'react';
import { Streamdown } from 'streamdown';
import { ImageWithPreview } from '@/components/image/image-with-preview';
import { CodeHighlight } from './CodeHighlight';

const NonMemoizedMarkdown: FC<{
  content: string;
  isAssistant: boolean;
}> = ({ content, isAssistant }) => {
  if (!isAssistant) {
    return (
      <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 bg-secondary w-[80vw] min-w-full space-y-6 break-words rounded-3xl px-5 py-2.5 sm:w-full overflow-hidden">
        <p className="mb-2 whitespace-pre-wrap last:mb-0 break-all">
          {content}
        </p>
      </div>
    );
  }

  const components = {
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      const { src, alt } = props;
      return <ImageWithPreview src={src!} alt={alt || 'image'} />;
    },
    code: CodeHighlight,
  } as const;

  return (
    <div className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 w-[80vw] min-w-full space-y-6 break-words sm:w-full">
      <Streamdown components={components}>{content}</Streamdown>
    </div>
  );
};

export const MessageMarkdown: FC<{
  content: string;
  isAssistant: boolean;
}> = memo(NonMemoizedMarkdown);
