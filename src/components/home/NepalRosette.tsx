/**
 * Original geometric rosette inspired by Nepali temple woodwork and
 * mandala lattice: an 8-point star, a ring of lotus petals and dotted
 * orbits. Strokes only (currentColor) so it stays a quiet backdrop.
 */
export function NepalRosette({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const dots = Array.from({ length: 48 }, (_, i) => (i / 48) * Math.PI * 2);
  return (
    <svg viewBox="0 0 200 200" className={`rays-turn ${className}`} style={{ animationDuration: "240s" }} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="98" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="88" strokeWidth="0.4" strokeDasharray="1 3" />
      {dots.map((a, i) => (
        <circle key={i} cx={+(100 + Math.cos(a) * 93).toFixed(2)} cy={+(100 + Math.sin(a) * 93).toFixed(2)} r="0.7" fill="currentColor" stroke="none" />
      ))}
      {petals.map((d) => (
        <path key={d} d="M100 22 C106 34 106 44 100 52 C94 44 94 34 100 22 Z" strokeWidth="0.6" transform={`rotate(${d} 100 100)`} />
      ))}
      {/* 8-point star from two squares */}
      <rect x="54" y="54" width="92" height="92" strokeWidth="0.6" />
      <rect x="54" y="54" width="92" height="92" strokeWidth="0.6" transform="rotate(45 100 100)" />
      <circle cx="100" cy="100" r="46" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="38" strokeWidth="0.4" strokeDasharray="2 2" />
    </svg>
  );
}
