import { useEffect, useState } from 'react';

const COLORS = ['#2F5BEA', '#FFD24D', '#F59E0B', '#2F9E44', '#E64980', '#1C7ED6', '#AE3EC9'];

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * CSS confetti burst. Increment `burst` to fire. Respects
 * prefers-reduced-motion by showing a gentle star pop instead.
 */
export default function Confetti({ burst }) {
  const [pieces, setPieces] = useState([]);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!burst) return undefined;
    if (prefersReducedMotion()) {
      setReduced(true);
      const t = setTimeout(() => setReduced(false), 1500);
      return () => clearTimeout(t);
    }
    setPieces(
      Array.from({ length: 90 }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 1.6 + Math.random() * 1.3,
        color: COLORS[i % COLORS.length],
        size: 7 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 200,
        rot: 360 + Math.random() * 720,
        round: Math.random() > 0.6,
      })),
    );
    const t = setTimeout(() => setPieces([]), 3400);
    return () => clearTimeout(t);
  }, [burst]);

  if (reduced) {
    return (
      <div className="celebrate-static" aria-hidden="true">
        🌟
      </div>
    );
  }
  if (!pieces.length) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.round ? p.size : p.size * 0.45}px`,
            borderRadius: p.round ? '50%' : '2px',
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
