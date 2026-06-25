import React from "react";
import type { Provider } from "../../types";

const GeminiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
    <path d="M12 7a.5.5 0 00-.5.5v4a.5.5 0 00.5.5h4a.5.5 0 000-1h-3.5V7.5a.5.5 0 00-.5-.5z" />
  </svg>
);

const GptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ClaudeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const GrokIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8h-3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h3" />
    <path d="M6 8h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6" />
    <path d="M12 8v8" />
  </svg>
);

const OtherIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export const ProviderIcon: React.FC<{ provider: Provider; className?: string }> = ({
  provider,
  className,
}) => {
  switch (provider) {
    case "gemini":
      return <GeminiIcon className={className} />;
    case "chatgpt":
      return <GptIcon className={className} />;
    case "claude":
      return <ClaudeIcon className={className} />;
    case "grok":
      return <GrokIcon className={className} />;
    case "other":
      return <OtherIcon className={className} />;
    default:
      return <OtherIcon className={className} />;
  }
};
