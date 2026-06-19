"use client";

import ReactMarkdown from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkGfm from "remark-gfm";

/**
 * AI 답변용 마크다운 렌더러. 굵게·목록·코드·링크 등 모델이 흔히 쓰는 문법만
 * Tailwind 자식 선택자로 스타일링한다(typography 플러그인 의존 없이).
 */
export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div
      className="space-y-2 text-sm leading-relaxed [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_em]:italic [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-foreground/10 [&_pre]:p-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCjkFriendly]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
