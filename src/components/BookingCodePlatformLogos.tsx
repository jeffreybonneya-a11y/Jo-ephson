import React from "react";

export interface PlatformConfig {
  id: string;
  name: string;
  shortName: string;
  officialUrl: string;
  officialSiteName: string;
  bgColor: string;
  borderColor: string;
  accentGradient: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
}

export const PLATFORMS_CONFIG: Record<string, PlatformConfig> = {
  ALL: {
    id: "ALL",
    name: "All Platforms",
    shortName: "All Slips",
    officialUrl: "#",
    officialSiteName: "All Platforms",
    bgColor: "bg-slate-900",
    borderColor: "border-amber-500/40",
    accentGradient: "from-amber-400 via-yellow-300 to-amber-500 text-slate-950",
    badgeBg: "bg-amber-400",
    badgeText: "text-slate-950",
    glowColor: "rgba(245, 158, 11, 0.35)",
  },
  SportyBet: {
    id: "SportyBet",
    name: "SportyBet",
    shortName: "SportyBet",
    officialUrl: "https://www.sportybet.com/gh/",
    officialSiteName: "SportyBet Ghana Official",
    bgColor: "bg-[#180A0C]",
    borderColor: "border-red-500/40",
    accentGradient: "from-red-600 via-rose-600 to-red-700 text-white",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    glowColor: "rgba(239, 68, 68, 0.35)",
  },
  Betway: {
    id: "Betway",
    name: "Betway",
    shortName: "Betway",
    officialUrl: "https://www.betway.com.gh/",
    officialSiteName: "Betway Ghana Official",
    bgColor: "bg-[#08120C]",
    borderColor: "border-emerald-500/40",
    accentGradient: "from-[#00A826] via-emerald-600 to-teal-800 text-white",
    badgeBg: "bg-[#00A826]",
    badgeText: "text-white",
    glowColor: "rgba(16, 185, 129, 0.35)",
  },
  "1xBet": {
    id: "1xBet",
    name: "1xBet",
    shortName: "1xBet",
    officialUrl: "https://1xbet.com.gh/",
    officialSiteName: "1xBet Ghana Official",
    bgColor: "bg-[#071324]",
    borderColor: "border-sky-500/40",
    accentGradient: "from-[#1A568C] via-[#1E90FF] to-blue-700 text-white",
    badgeBg: "bg-[#1E90FF]",
    badgeText: "text-white",
    glowColor: "rgba(30, 144, 255, 0.35)",
  },
  Mozzart: {
    id: "Mozzart",
    name: "Mozzart Bet",
    shortName: "Mozzart",
    officialUrl: "https://www.mozzartbet.com.gh/",
    officialSiteName: "Mozzart Bet Ghana Official",
    bgColor: "bg-[#141205]",
    borderColor: "border-yellow-400/40",
    accentGradient: "from-[#FFCC00] via-amber-400 to-yellow-500 text-slate-950",
    badgeBg: "bg-[#FFCC00]",
    badgeText: "text-slate-950",
    glowColor: "rgba(250, 204, 21, 0.35)",
  },
  "22Bet": {
    id: "22Bet",
    name: "22Bet",
    shortName: "22Bet",
    officialUrl: "https://22bet.com.gh/",
    officialSiteName: "22Bet Ghana Official",
    bgColor: "bg-[#04171A]",
    borderColor: "border-teal-500/40",
    accentGradient: "from-[#004851] via-[#0E5B64] to-[#26ADB9] text-white",
    badgeBg: "bg-[#0E5B64]",
    badgeText: "text-white",
    glowColor: "rgba(38, 173, 185, 0.35)",
  },
  Bet9ja: {
    id: "Bet9ja",
    name: "Bet9ja",
    shortName: "Bet9ja",
    officialUrl: "https://sports.bet9ja.com/",
    officialSiteName: "Bet9ja Official",
    bgColor: "bg-[#05180D]",
    borderColor: "border-green-500/40",
    accentGradient: "from-[#006838] via-emerald-700 to-green-800 text-white",
    badgeBg: "bg-[#006838]",
    badgeText: "text-white",
    glowColor: "rgba(34, 197, 94, 0.35)",
  },
};

// 1. SportyBet Official Vector SVG Logo
export function SportyBetLogo({ className = "h-7 w-auto", alt = "SportyBet official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 160 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      {/* Background container pill */}
      <rect x="0.5" y="0.5" width="159" height="41" rx="8" fill="#E41B23" stroke="#FF4D55" strokeWidth="1" />
      {/* Soccer Ball icon in circle */}
      <g transform="translate(10, 8.5)">
        <circle cx="12.5" cy="12.5" r="12" fill="#FFFFFF" />
        {/* Soccer ball pattern Pentagon & lines */}
        <polygon points="12.5,7 16.5,10 15,15 10,15 8.5,10" fill="#E41B23" />
        <line x1="12.5" y1="7" x2="12.5" y2="1" stroke="#E41B23" strokeWidth="1.5" />
        <line x1="16.5" y1="10" x2="22" y2="7.5" stroke="#E41B23" strokeWidth="1.5" />
        <line x1="15" y1="15" x2="19.5" y2="21" stroke="#E41B23" strokeWidth="1.5" />
        <line x1="10" y1="15" x2="5.5" y2="21" stroke="#E41B23" strokeWidth="1.5" />
        <line x1="8.5" y1="10" x2="3" y2="7.5" stroke="#E41B23" strokeWidth="1.5" />
      </g>
      {/* Text: sporty */}
      <text
        x="42"
        y="26.5"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="-0.3px"
      >
        sporty
      </text>
      {/* Text: bet */}
      <rect x="100" y="7.5" width="48" height="27" rx="5" fill="#FFFFFF" />
      <text
        x="108"
        y="26.5"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#E41B23"
        letterSpacing="-0.3px"
      >
        bet
      </text>
    </svg>
  );
}

// 2. Betway Official Vector SVG Logo
export function BetwayLogo({ className = "h-7 w-auto", alt = "Betway official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 150 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="149" height="41" rx="8" fill="#000000" stroke="#222222" strokeWidth="1" />
      {/* "bet" in white */}
      <text
        x="18"
        y="28"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="21"
        fontWeight="800"
        fill="#FFFFFF"
        letterSpacing="-0.5px"
      >
        bet
      </text>
      {/* "way" in vibrant green */}
      <text
        x="55"
        y="28"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="21"
        fontWeight="800"
        fill="#00A826"
        letterSpacing="-0.5px"
      >
        way
      </text>
      {/* Betway iconic green curve accent dot */}
      <circle cx="107" cy="14" r="3" fill="#00A826" />
      <path d="M 120 12 Q 132 21 122 30" stroke="#00A826" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 3. 1xBet Official Vector SVG Logo
export function OneXBetLogo({ className = "h-7 w-auto", alt = "1xBet official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 150 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="149" height="41" rx="8" fill="#0F3B66" stroke="#1E90FF" strokeWidth="1" />
      {/* 1X in White italic block font */}
      <text
        x="16"
        y="29"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="23"
        fontStyle="italic"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.5px"
      >
        1X
      </text>
      {/* BET in vibrant cyan */}
      <rect x="62" y="7.5" width="74" height="27" rx="5" fill="#1E90FF" />
      <text
        x="72"
        y="27.5"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="21"
        fontStyle="italic"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="1px"
      >
        BET
      </text>
    </svg>
  );
}

// 4. Mozzart Bet Official Vector SVG Logo
export function MozzartLogo({ className = "h-7 w-auto", alt = "Mozzart Bet official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 155 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="154" height="41" rx="8" fill="#0A1833" stroke="#FFCC00" strokeWidth="1" />
      {/* Mozzart iconic stylized M */}
      <g transform="translate(10, 8.5)">
        <path d="M 2 20 L 2 5 L 8 14 L 14 5 L 14 20" stroke="#FFCC00" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <polygon points="8,10 11,5 5,5" fill="#FFA500" />
      </g>
      {/* MOZZART */}
      <text
        x="34"
        y="26"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="14"
        fontWeight="900"
        fill="#FFCC00"
        letterSpacing="0.5px"
      >
        MOZZART
      </text>
      {/* BET */}
      <rect x="110" y="9.5" width="34" height="23" rx="4" fill="#FFCC00" />
      <text
        x="114"
        y="26"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="13"
        fontWeight="900"
        fill="#0A1833"
        letterSpacing="0.5px"
      >
        BET
      </text>
    </svg>
  );
}

// 5. 22Bet Official Vector SVG Logo
export function TwentyTwoBetLogo({ className = "h-7 w-auto", alt = "22Bet official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 145 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="144" height="41" rx="8" fill="#00353B" stroke="#26ADB9" strokeWidth="1" />
      {/* Red '2' box */}
      <rect x="12" y="8" width="22" height="26" rx="5" fill="#E84342" />
      <text
        x="16"
        y="27"
        fontFamily="'Arial Black', sans-serif"
        fontSize="19"
        fontWeight="900"
        fill="#FFFFFF"
      >
        2
      </text>
      {/* White '2' box */}
      <rect x="37" y="8" width="22" height="26" rx="5" fill="#FFFFFF" />
      <text
        x="41"
        y="27"
        fontFamily="'Arial Black', sans-serif"
        fontSize="19"
        fontWeight="900"
        fill="#00353B"
      >
        2
      </text>
      {/* BET */}
      <text
        x="68"
        y="28"
        fontFamily="'Arial Black', sans-serif"
        fontSize="18"
        fontWeight="900"
        fill="#26ADB9"
        letterSpacing="1px"
      >
        BET
      </text>
    </svg>
  );
}

// 6. Bet9ja Official Vector SVG Logo
export function Bet9jaLogo({ className = "h-7 w-auto", alt = "Bet9ja official logo" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 145 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="144" height="41" rx="8" fill="#004626" stroke="#00A859" strokeWidth="1" />
      {/* "bet" in white */}
      <text
        x="16"
        y="28"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="21"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="-0.5px"
      >
        bet
      </text>
      {/* "9ja" in bright lime/orange green gradient look */}
      <rect x="62" y="8" width="68" height="26" rx="6" fill="#00A859" />
      <text
        x="72"
        y="27.5"
        fontFamily="'Arial Black', sans-serif"
        fontSize="17"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.5px"
      >
        9ja
      </text>
    </svg>
  );
}

// 7. ALL PLATFORMS / ALL SLIPS Crown SVG Badge
export function AllPlatformsLogo({ className = "h-7 w-auto", alt = "All Betting Platforms" }: { className?: string; alt?: string }) {
  return (
    <svg
      viewBox="0 0 145 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={alt}
      role="img"
    >
      <title>{alt}</title>
      <rect x="0.5" y="0.5" width="144" height="41" rx="8" fill="#1E1805" stroke="#F59E0B" strokeWidth="1" />
      {/* Crown icon */}
      <g transform="translate(14, 11)">
        <polygon points="0,17 3,5 9,11 15,5 18,17" fill="#F59E0B" />
        <circle cx="3" cy="4" r="1.5" fill="#FDE68A" />
        <circle cx="9" cy="9" r="1.5" fill="#FDE68A" />
        <circle cx="15" cy="4" r="1.5" fill="#FDE68A" />
        <rect x="0" y="16" width="18" height="3" rx="1" fill="#D97706" />
      </g>
      {/* ALL SLIPS text */}
      <text
        x="42"
        y="27"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="15"
        fontWeight="900"
        fill="#FDE68A"
        letterSpacing="0.8px"
      >
        ALL SLIPS
      </text>
    </svg>
  );
}

// Universal Platform Logo Component by Key
export function PlatformLogo({
  platform,
  className = "h-7 w-auto object-contain",
  showFallbackText = true,
}: {
  platform: string;
  className?: string;
  showFallbackText?: boolean;
}) {
  const norm = (platform || "").trim().toLowerCase();

  if (norm.includes("sporty")) {
    return <SportyBetLogo className={className} alt="SportyBet logo" />;
  }
  if (norm.includes("betway")) {
    return <BetwayLogo className={className} alt="Betway logo" />;
  }
  if (norm.includes("1x") || norm.includes("onex")) {
    return <OneXBetLogo className={className} alt="1xBet logo" />;
  }
  if (norm.includes("mozzart")) {
    return <MozzartLogo className={className} alt="Mozzart Bet logo" />;
  }
  if (norm.includes("22") || norm.includes("twentytwo")) {
    return <TwentyTwoBetLogo className={className} alt="22Bet logo" />;
  }
  if (norm.includes("9ja") || norm.includes("bet9ja")) {
    return <Bet9jaLogo className={className} alt="Bet9ja logo" />;
  }
  if (norm === "all" || norm === "all platforms" || norm === "") {
    return <AllPlatformsLogo className={className} alt="All Betting Platforms" />;
  }

  // Fallback if custom platform string
  return (
    <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-black text-xs uppercase flex items-center justify-center">
      {platform}
    </div>
  );
}
