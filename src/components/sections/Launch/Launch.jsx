import { useEffect, useRef, useState, useCallback } from 'react';
import './Launch.css';
import { rand, clamp } from '../../../utils/helpers';

const STAGE_DATA = [
  { num: '1', desc: 'Super Heavy booster firing — 33 Raptor engines at full thrust. Throttle: 100%' },
  { num: '2', desc: 'Stage separation nominal. Starship upper stage ignition confirmed. Orbit insertion burn.' },
  { num: '3', desc: 'Trans-Mars Injection burn complete. Course locked. Engines shutdown.' },
];

export default function Launch({ active = false }) {
  const bgCanvasRef  = useRef(null);
  const exCanvasRef  = useRef(null);
  const partsRef     = useRef([]);
  const activeRef    = useRef(false);
  const rafExRef     = useRef(null);
  const rafBgRef     = useRef(null);

  const [telemetry, setTelemetry] = useState({
    alt: 0, vel: 0, fuel: 100, gForce: 1.0,
    time: 'T+00:00',
  });
  const [stage, setStage] = useState(STAGE_DATA[0]);

  /* ── Background streak canvas ── */
  useEffect(() => {
    const c   = bgCanvasRef.current;
    const ctx = c.getContext('2d');
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const streaks = Array.from({ length: 60 }, () => ({
      x: rand(0, c.width || window.innerWidth),
      y: rand(0, c.height || window.innerHeight),
      len: rand(30, 120), speed: rand(1.5, 4),
      opacity: rand(0.05, 0.25),
    }));

    const draw = () => {
      if (!c.width) { rafBgRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, c.width, c.height);
      streaks.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y - s.len);
        ctx.strokeStyle = `rgba(180,220,255,${s.opacity})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
        s.y += s.speed;
        if (s.y > c.height + s.len) { s.y = -s.len; s.x = rand(0, c.width); }
      });
      rafBgRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(rafBgRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Exhaust particle canvas ── */
  useEffect(() => {
    const c   = exCanvasRef.current;
    const ctx = c.getContext('2d');
    c.width = 200; c.height = 200;

    const spawn = () => {
      for (let i = 0; i < 8; i++) {
        partsRef.current.push({
          x: 100 + rand(-12, 12), y: 10,
          vx: rand(-2, 2), vy: rand(2, 6),
          life: rand(30, 60), maxLife: rand(30, 60),
          r: rand(3, 10),
          col: Math.random() < 0.5 ? [255, 150, 0] : [255, 220, 80],
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);
      if (activeRef.current) spawn();
      for (let i = partsRef.current.length - 1; i >= 0; i--) {
        const p = partsRef.current[i];
        p.life--;
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.r *= 0.97;
        const a = p.life / p.maxLife;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${p.col.join(',')},${a})`);
        g.addColorStop(1, `rgba(${p.col.join(',')},0)`);
        ctx.globalAlpha = a * 0.9;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) partsRef.current.splice(i, 1);
      }
      rafExRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafExRef.current);
  }, []);

  /* ── Launch telemetry ticker ── */
  useEffect(() => {
    if (!active) return;
    activeRef.current = true;
    let t = 0;
    const id = setInterval(() => {
      t++;
      const altPct  = clamp(t * 1.2, 0, 100);
      const velPct  = clamp(t * 0.9, 0, 100);
      const fuelPct = clamp(100 - t * 0.7, 0, 100);
      const gForce  = t < 30 ? 1 + t * 0.25 : t < 70 ? 8.5 - (t - 30) * 0.15 : 1.5;

      setTelemetry({
        alt:    altPct,
        altKm:  Math.round(altPct * 4.5),
        vel:    velPct,
        velKms: (velPct * 0.287).toFixed(2),
        fuel:   fuelPct,
        gForce: clamp(gForce, 0, 10),
        time:   `T+${String(Math.floor(t / 2)).padStart(2,'0')}:${String((t * 30) % 60).padStart(2,'0')}`,
      });

      if (t === 30) setStage(STAGE_DATA[1]);
      if (t === 70) { setStage(STAGE_DATA[2]); activeRef.current = false; }
      if (t >= 100) clearInterval(id);
    }, 80);

    return () => { clearInterval(id); activeRef.current = false; };
  }, [active]);

  return (
    <section id="launch" className="launch">
      <canvas ref={bgCanvasRef} className="launchCanvas" />

      <div className="launchGrid">
        {/* Text column */}
        <div>
          <span className="phase-label reveal" style={{ color: '#FF5E00' }}>Phase 01 — Ignition</span>
          <h2 className="section-title reveal" style={{ color: '#fff' }}>
            LAUNCH<br /><span style={{ color: '#FF5E00' }}>SEQUENCE</span>
          </h2>
          <p className="section-body reveal">
            The Starship HLS ignites its 33 Raptor engines simultaneously, producing 7,500 tonnes
            of thrust. In 3 minutes, we're through Max-Q — maximum aerodynamic pressure — and
            clear of Earth's atmosphere.
          </p>

          {/* Telemetry */}
          <div className="telePanel reveal">
            <div className="teleHeader">
              <span>LAUNCH TELEMETRY</span>
              <span>{telemetry.time}</span>
            </div>
            <div className="teleBody">
              {[
                { key: 'Altitude',      val: `${telemetry.altKm ?? 0} km`,                pct: telemetry.alt,    color: '#4da6ff' },
                { key: 'Velocity',      val: `${telemetry.velKms ?? '0.00'} km/s`,         pct: telemetry.vel,    color: '#FFAA00' },
                { key: 'Fuel Remaining',val: `${Math.round(telemetry.fuel ?? 100)}%`,      pct: telemetry.fuel,   color: '#00FF88' },
                { key: 'G-Force',       val: `${(telemetry.gForce ?? 1).toFixed(1)} G`,   pct: clamp((telemetry.gForce ?? 1) / 10 * 100, 0, 100), color: '#FFD60A', warn: true },
              ].map(({ key, val, pct, color, warn }) => (
                <div key={key} className="gaugeRow">
                  <div className="gaugeMeta">
                    <span className="gaugeKey">{key}</span>
                    <span className={`gaugeVal${warn ? ' warn' : ''}`}>{val}</span>
                  </div>
                  <div className="gaugeTrack">
                    <div className="gaugeFill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage info */}
          <div className="stageInfo reveal">
            <div className="stageNum">{stage.num}</div>
            <div className="stageLbl">Active Stage</div>
            <div className="stageDesc">{stage.desc}</div>
          </div>
        </div>

        {/* Rocket viz column */}
        <div className="rocketCol reveal">
          <svg className="rocketSvg" viewBox="0 0 100 260" xmlns="http://www.w3.org/2000/svg">
            <path d="M50,10 C50,10 35,60 35,130 L65,130 C65,60 50,10 50,10 Z" fill="#c8d8e8" stroke="rgba(255,255,255,.2)" strokeWidth=".5"/>
            <path d="M50,8 C50,8 42,40 38,65 L62,65 C58,40 50,8 50,8 Z" fill="#e8f0f8"/>
            <circle cx="50" cy="90" r="7" fill="rgba(100,180,255,.4)" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
            <circle cx="50" cy="90" r="4" fill="rgba(150,210,255,.6)"/>
            <circle cx="50" cy="110" r="4" fill="rgba(100,180,255,.3)" stroke="rgba(255,255,255,.2)" strokeWidth=".8"/>
            <path d="M35,130 L10,175 L35,160 Z" fill="#a0b0c0" opacity=".9"/>
            <path d="M65,130 L90,175 L65,160 Z" fill="#a0b0c0" opacity=".9"/>
            <line x1="33" y1="115" x2="67" y2="115" stroke="rgba(255,94,0,.5)" strokeWidth="1" strokeDasharray="3,2"/>
            <text x="50" y="148" textAnchor="middle" fontFamily="Share Tech Mono" fontSize="5" fill="rgba(255,255,255,.4)" letterSpacing="2">ARES</text>
            <ellipse cx="50" cy="172" rx="14" ry="5" fill="#666"/>
            <path d="M36,168 L30,180 L70,180 L64,168 Z" fill="#555"/>
            <ellipse cx="50" cy="181" rx="12" ry="4" fill="rgba(255,150,0,.6)"/>
          </svg>
          <canvas ref={exCanvasRef} className="exhaustCanvas" />
        </div>
      </div>
    </section>
  );
}
