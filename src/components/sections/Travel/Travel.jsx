import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Travel.css';
import { rand, lerp, clamp, createStarField, drawStars } from '../../../utils/helpers';

gsap.registerPlugin(ScrollTrigger);

const LOG_LINES = [
  'Day 001 · Translunar injection burn complete',
  'Day 014 · Moon gravity assist executed',
  'Day 042 · Solar panels nominal · Power: 98%',
  'Day 089 · Asteroid belt entry · Shields active',
  'Day 127 · Mid-course correction burn',
  'Day 200 · Mars optical approach initiated',
  'Day 253 · Mars orbit insertion burn',
];

export default function Travel() {
  const bgCanvasRef   = useRef(null);
  const trajCanvasRef = useRef(null);
  const starsRef      = useRef([]);
  const shootsRef     = useRef([]);
  const rafBgRef      = useRef(null);

  const [counters, setCounters] = useState({ days: 0, dist: '0.00', fuel: 68, speed: '30,000', delay: '3 min 24 sec' });
  const progressRef = useRef(0);

  /* ── Deep-space star field ── */
  useEffect(() => {
    const c   = bgCanvasRef.current;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width  = window.innerWidth;
      c.height = c.offsetHeight || window.innerHeight;
      starsRef.current = createStarField(500, c.width, c.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const shootTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        shootsRef.current.push({
          x: rand(0, window.innerWidth), y: rand(0, window.innerHeight * 0.5),
          vx: rand(-8, -3), vy: rand(2, 5), life: 40, maxLife: 40,
        });
      }
    }, 2000);

    const draw = () => {
      if (!c.width) { rafBgRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, c.width, c.height);
      drawStars(ctx, starsRef.current, c.width, c.height);
      // shooting stars
      for (let i = shootsRef.current.length - 1; i >= 0; i--) {
        const s = shootsRef.current[i];
        const a = s.life / s.maxLife;
        ctx.beginPath(); ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.7})`;
        ctx.lineWidth = a * 1.5; ctx.stroke();
        s.x += s.vx; s.y += s.vy; s.life--;
        if (s.life <= 0) shootsRef.current.splice(i, 1);
      }
      rafBgRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafBgRef.current);
      clearInterval(shootTimer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Trajectory arc + scroll scrub ── */
  useEffect(() => {
    const c   = trajCanvasRef.current;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width  = c.offsetWidth  || 400;
      c.height = c.offsetHeight || Math.round((c.offsetWidth || 400) / 1.4);
    };
    resize();
    window.addEventListener('resize', resize);

    const drawTraj = (p) => {
      if (!c.width) return;
      const W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);

      // orbit rings
      ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
      [0.22, 0.38, 0.56, 0.7].forEach(r => {
        ctx.beginPath(); ctx.arc(W * 0.5, H * 0.65, r * W * 0.75, 0, Math.PI * 2); ctx.stroke();
      });

      // Sun
      const sx = W * 0.5, sy = H * 0.65;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 45);
      sg.addColorStop(0, 'rgba(255,240,160,1)'); sg.addColorStop(0.5, 'rgba(255,180,0,.6)'); sg.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(sx, sy, 45, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2); ctx.fillStyle = '#FFEC60'; ctx.fill();

      // Earth
      const er = W * 0.22, ea = -Math.PI * 0.8;
      const ex = sx + er * Math.cos(ea), ey = sy + er * Math.sin(ea);
      ctx.beginPath(); ctx.arc(sx, sy, er, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,180,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
      const eg = ctx.createRadialGradient(ex - 2, ey - 2, 1, ex, ey, 8);
      eg.addColorStop(0, '#4fc3f7'); eg.addColorStop(1, '#1565c0');
      ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fillStyle = eg; ctx.fill();

      // Mars
      const mr = W * 0.44, ma = -Math.PI * 0.15;
      const mx = sx + mr * Math.cos(ma), my = sy + mr * Math.sin(ma);
      ctx.beginPath(); ctx.arc(sx, sy, mr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,100,30,.12)'; ctx.lineWidth = 1; ctx.stroke();
      const mg = ctx.createRadialGradient(mx - 1, my - 1, 1, mx, my, 6);
      mg.addColorStop(0, '#E8651A'); mg.addColorStop(1, '#8B2500');
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();

      // Transfer arc
      const N = 120;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t  = i / N;
        const cx1 = sx, cy1 = sy - W * 0.12;
        const bx = lerp(lerp(ex, cx1, t), lerp(cx1, mx, t), t);
        const by = lerp(lerp(ey, cy1, t), lerp(cy1, my, t), t);
        pts.push({ x: bx, y: by });
      }

      // Faint full arc
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);

      // Progress arc
      const pi = Math.floor(p * N);
      if (pi > 1) {
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i <= pi; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = 'rgba(0,255,136,.6)'; ctx.lineWidth = 2; ctx.stroke();
      }

      // Spacecraft
      if (pi > 0 && pi < pts.length) {
        const sp = pts[pi];
        const g2 = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 10);
        g2.addColorStop(0, 'rgba(0,255,136,1)'); g2.addColorStop(1, 'rgba(0,255,136,0)');
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      }

      // Labels
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px Share Tech Mono'; ctx.fillStyle = 'rgba(100,180,255,.7)';
      ctx.fillText('EARTH', ex, ey + 20);
      ctx.fillStyle = 'rgba(232,101,26,.7)';
      ctx.fillText('MARS', mx, my + 18);
      ctx.fillStyle = 'rgba(255,240,160,.6)';
      ctx.fillText('SUN', sx, sy + 36);
      ctx.textAlign = 'left';
    };

    drawTraj(0);

    const st = ScrollTrigger.create({
      trigger: '#travel', start: 'top center', end: 'bottom center', scrub: 2,
      onUpdate: self => {
        const p = clamp(self.progress, 0, 1);
        progressRef.current = p;
        drawTraj(p);
        setCounters({
          days:  Math.round(p * 253),
          dist:  (p * 54.6).toFixed(1),
          fuel:  Math.round(68 - p * 8),
          speed: '30,000',
          delay: `${Math.floor(3 + p * 20)} min ${Math.floor(rand(0, 59))} sec`,
        });
      },
    });

    return () => {
      st.kill();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section id="travel" className="travel">
      <canvas ref={bgCanvasRef} className="travelCanvas" />

      <div className="travelGrid">
        {/* Trajectory */}
        <div className="trajWrap reveal">
          <canvas ref={trajCanvasRef} className="trajCanvas" />
        </div>

        {/* Data column */}
        <div>
          <span className="phase-label reveal" style={{ color: 'rgba(150,200,255,.7)' }}>Phase 02 — Deep Space Transit</span>
          <h2 className="section-title reveal" style={{ color: '#fff' }}>
            7 MONTHS<br /><span style={{ color: 'rgba(100,160,255,.8)' }}>OF SILENCE</span>
          </h2>
          <p className="section-body reveal">
            Coasting through the interplanetary medium at 30,000 km/h. Earth shrinks to a
            pale blue dot. The crew operates on a 24.6-hour Martian sol schedule to
            pre-adapt their circadian rhythms.
          </p>

          <div className="transitCounters reveal">
            {[
              { val: counters.days,       label: 'Days Elapsed',    color: '#4da6ff' },
              { val: counters.dist+'M km',label: 'Distance Covered',color: '#fff'    },
              { val: counters.fuel+'%',   label: 'Fuel Reserve',    color: '#00FF88' },
              { val: counters.speed,      label: 'km/h Velocity',   color: '#FFAA00' },
            ].map(({ val, label, color }) => (
              <div key={label} className="tcCard">
                <span className="tcVal" style={{ color }}>{val}</span>
                <span className="tcLbl">{label}</span>
              </div>
            ))}
          </div>

          <div className="signalBar reveal">
            <div className="signalIcon">📡</div>
            <div className="signalText">
              Current comm delay: <span>{counters.delay}</span><br />
              Earth contact: <span className="ok">NOMINAL</span> · Next window in <span>4h 32m</span>
            </div>
          </div>

          <div className="missionLog reveal">
            <div className="logHeader">MISSION LOG</div>
            {LOG_LINES.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
