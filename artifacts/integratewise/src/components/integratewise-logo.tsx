export function IntegrateWiseLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer hub circle */}
      <circle cx="20" cy="20" r="16" fill="#F4F4F6" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Left strand (solid spine) */}
      <path d="M14 26C14 22 14 18 14 14" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />

      {/* Right strand (solid spine) */}
      <path d="M26 26C26 22 26 18 26 14" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />

      {/* Middle strand – top segment (in front of left, behind right) */}
      <path d="M20 24C19 21.5 18.5 19 18.5 16.5" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M20 24C21 21.5 21.5 19 21.5 16.5"
        stroke="#3F3182"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Middle strand – bottom segment (in front of right, behind left) */}
      <path d="M20 24C21 26.5 21.5 29 21.5 31" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M20 24C19 26.5 18.5 29 18.5 31"
        stroke="#3F3182"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Accent node (Cognitive Twin / IQ Hub) */}
      <circle cx="27.5" cy="11.5" r="3" fill="#E94B8A" />
      <circle cx="27.5" cy="11.5" r="4.5" stroke="#E94B8A" strokeWidth="1" opacity="0.25" />
    </svg>
  )
}

// Horizontal logo variant with wordmark
export function IntegrateWiseLogoHorizontal({ className = "" }: { className?: string }) {
  return (
    <svg
      width="220"
      height="44"
      viewBox="0 0 220 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Logomark group */}
      <g transform="translate(2,2)">
        <circle cx="20" cy="20" r="16" fill="#F4F4F6" stroke="#E2E8F0" strokeWidth="1.5" />
        <path d="M14 26C14 22 14 18 14 14" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M26 26C26 22 26 18 26 14" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 24C19 21.5 18.5 19 18.5 16.5" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M20 24C21 21.5 21.5 19 21.5 16.5"
          stroke="#3F3182"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path d="M20 24C21 26.5 21.5 29 21.5 31" stroke="#3F3182" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M20 24C19 26.5 18.5 29 18.5 31"
          stroke="#3F3182"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.45"
        />
        <circle cx="27.5" cy="11.5" r="3" fill="#E94B8A" />
        <circle cx="27.5" cy="11.5" r="4.5" stroke="#E94B8A" strokeWidth="1" opacity="0.25" />
      </g>

      {/* Wordmark group */}
      <g transform="translate(52, 13)">
        <text
          x="0"
          y="16"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
          fontSize="17"
          fontWeight="600"
          fill="#0F172A"
          letterSpacing="0.03em"
        >
          Integrate
        </text>
        <text
          x="96"
          y="16"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
          fontSize="17"
          fontWeight="700"
          fill="#3F3182"
          letterSpacing="0.03em"
        >
          Wise
        </text>
      </g>
    </svg>
  )
}
