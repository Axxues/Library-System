// Deterministic gradient cover from any title. ponytail: CSS initials, no image assets.
const hues = [262, 22, 210, 150, 0, 190, 320, 100];
export function hue(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 997; return hues[h % hues.length]; }
export function initials(s) { return String(s || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }
export function Cover({ title }) {
  const h = hue(title);
  return <span className="cover" style={{ background: `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 40) % 360} 65% 35%)` }}>{initials(title)}</span>;
}
