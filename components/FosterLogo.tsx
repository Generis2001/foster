"use client";

export function FosterLogo({ height = 40 }: { height?: number }) {
  return (
    <svg width={height} height={height} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Single circle — dark navy */}
      <circle cx="22" cy="22" r="21" fill="#0E2D6B" />

      {/* Coin stack: 3 horizontal discs */}
      <ellipse cx="22" cy="35" rx="9.5" ry="2.6" fill="white" />
      <ellipse cx="22" cy="30" rx="9.5" ry="2.6" fill="white" />
      <ellipse cx="22" cy="25" rx="9.5" ry="2.6" fill="white" />

      {/* Stem growing up from top coin */}
      <rect x="21" y="13" width="2" height="12" rx="1" fill="white" />

      {/* Left leaf — curves out to the left */}
      <ellipse
        cx="16.5" cy="17"
        rx="5.5" ry="1.9"
        transform="rotate(-42 16.5 17)"
        fill="white"
      />
      {/* Right leaf — curves out to the right */}
      <ellipse
        cx="27.5" cy="13.5"
        rx="5.5" ry="1.9"
        transform="rotate(42 27.5 13.5)"
        fill="white"
      />
    </svg>
  );
}
