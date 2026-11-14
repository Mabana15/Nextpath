interface BrandLogoProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function BrandLogo({ onClick, size = 'md' }: BrandLogoProps) {
  const iconSize = size === 'sm' ? 28 : 34;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D6FF] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sbGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8257FF" />
            <stop offset="100%" stopColor="#35D6FF" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="#111A33" stroke="url(#sbGrad)" strokeWidth="1.75" />
        <path
          d="M10 23C10 17.5 14.2 13 19.5 13H26"
          stroke="#35D6FF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M10 23L16 17L20.5 21L26 13"
          stroke="#8257FF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="23" r="2.3" fill="#FFFFFF" />
        <circle cx="26" cy="13" r="2.3" fill="#35D6FF" />
      </svg>
      <span className="font-display font-bold tracking-tight text-white text-lg whitespace-nowrap shrink-0">
        SkillBridge <span className="text-[#35D6FF]">AI</span>
      </span>
    </button>
  );
}
