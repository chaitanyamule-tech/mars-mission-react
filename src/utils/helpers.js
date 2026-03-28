// ── Math helpers ──────────────────────────────
export const lerp  = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand  = (a, b)    => a + Math.random() * (b - a);

// ── Time formatter T+DD:HH:MM:SS ──────────────
export function formatMissionTime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `T+${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ── Countdown mm:ss ───────────────────────────
export function formatCountdown(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Generate terrain points ───────────────────
export function generateTerrain(startX, segCount, segWidth, height) {
  const pts = [];
  let y = height * 0.62;
  for (let i = 0; i <= segCount; i++) {
    y += rand(-14, 14);
    y = clamp(y, height * 0.45, height * 0.78);
    pts.push({ x: startX + i * segWidth, y });
  }
  return pts;
}

// ── Get ground Y from terrain array ──────────
export function getGroundY(terrainPts, worldX, screenX, fallback = 240) {
  const wx = screenX + worldX;
  for (let i = 0; i < terrainPts.length - 1; i++) {
    if (terrainPts[i].x <= wx && terrainPts[i + 1].x > wx) {
      const t = (wx - terrainPts[i].x) / (terrainPts[i + 1].x - terrainPts[i].x);
      return lerp(terrainPts[i].y, terrainPts[i + 1].y, t);
    }
  }
  return fallback;
}

// ── Draw star field on canvas ─────────────────
export function createStarField(count, width, height) {
  return Array.from({ length: count }, () => ({
    x:  rand(0, width),
    y:  rand(0, height),
    r:  rand(0.4, 2.2),
    op: rand(0.15, 0.7),
    tw: rand(0, Math.PI * 2),
    ts: rand(0.003, 0.015),
  }));
}

export function drawStars(ctx, stars, width, height) {
  stars.forEach(s => {
    s.tw += s.ts;
    const a = s.op * (0.6 + 0.4 * Math.sin(s.tw));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 235, 255, ${a})`;
    ctx.fill();
  });
}
