// Deterministic gradient cover from any title. ponytail: CSS initials, no image assets.
const hues = [262, 22, 210, 150, 0, 190, 320, 100];
export function hue(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 997; return hues[h % hues.length]; }
export function initials(s) { return String(s || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }
export function Cover({ title, size, src }) {
  const cls = 'cover' + (size === 'lg' ? ' lg' : '');
  if (src) return <img src={src} alt="" className={cls + ' object-cover'} />;
  const h = hue(title);
  return <span className={cls} style={{ background: `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 40) % 360} 65% 35%)` }}>{initials(title)}</span>;
}
// Downscale an uploaded image to a small JPEG data URL for DB storage (same base64 trick as staff avatars).
// ponytail: native canvas, no dep; 400px keeps covers under the ~150KB server cap.
export function fileToCoverDataUrl(file, maxDim = 400) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('could not read image')); };
    img.src = url;
  });
}
