"use client";

export function FosterLogo({ height = 40 }: { height?: number }) {
  const width = Math.round(height * (88 / 54));
  return (
    <svg width={width} height={height} viewBox="0 0 88 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Right circle: white fill — drawn first, behind everything */}
      <circle cx="61" cy="27" r="25" fill="white" />

      {/* Right circle content: ascending stair steps + upward arrow (dark navy) */}
      <rect x="49" y="37" width="8" height="3.5" rx="0.5" fill="#1B3A6B" />
      <rect x="57" y="31" width="8" height="3.5" rx="0.5" fill="#1B3A6B" />
      <rect x="65" y="25" width="8" height="3.5" rx="0.5" fill="#1B3A6B" />
      <path d="M70 23 L74.5 17.5 L79 23" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="74.5" y1="17.5" x2="74.5" y2="25.5" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round" />

      {/* Left circle: dark navy — covers the overlap region */}
      <circle cx="27" cy="27" r="25" fill="#1B3A6B" />

      {/* Left circle content: coin stack + plant sprout (white) */}
      <ellipse cx="27" cy="25.5" rx="8.5" ry="2.5" fill="white" />
      <ellipse cx="27" cy="31"   rx="8.5" ry="2.5" fill="white" />
      <ellipse cx="27" cy="36.5" rx="8.5" ry="2.5" fill="white" />

      {/* Stem */}
      <rect x="26" y="14" width="2" height="11.5" rx="1" fill="white" />
      {/* Left leaf */}
      <ellipse cx="22.5" cy="17" rx="5" ry="1.8" transform="rotate(-35 22.5 17)" fill="white" />
      {/* Right leaf */}
      <ellipse cx="31.5" cy="14" rx="5" ry="1.8" transform="rotate(35 31.5 14)" fill="white" />

      {/* Right circle border — drawn last, on top of everything */}
      <circle cx="61" cy="27" r="25" stroke="#4B8FD4" strokeWidth="2.5" />
    </svg>
  );
}
