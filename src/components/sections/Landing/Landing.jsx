import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './Landing.css';
import { rand } from '../../../utils/helpers';

const EDL_STEPS = [
  { name: 'Atmospheric Entry',  detail: '125 km altitude · 20,000 km/h · Heat shield ablating',    heat: 180,  alt: 120, vel: '20,000 km/h', g: '0.0', chute: 'STOWED',    delay: 1200 },
  { name: 'Peak Heating',       detail: '1,600°C · 8G deceleration · Plasma blackout',              heat: 1600, alt: 55,  vel: '18,500 km/h', g: '8.0', chute: 'ARMED',     delay: 2000 },
  { name: 'Parachute Deploy',   detail: '11 km altitude · 380 m/s · Chute inflation confirmed',     heat: 600,  alt: 11,  vel: '1,400 km/h',  g: '2.0', chute: 'DEPLOYED',  delay: 1800 },
  { name: 'Sky Crane Ignition', detail: '2 km · Retro rockets firing · Lowering lander',            heat: 80,   alt: 2,   vel: '290 km/h',    g: '0.5', chute: 'JETTISONED',delay: 1800 },
  { name: 'Touchdown Confirmed',detail: 'Jezero Crater · 0 m/s · All systems nominal',             heat: 30,   alt: 0,   vel: '0 km/h',      g: '0.0', chute: 'N/A',       delay: 1200 },
];

export default function Landing() {
  const landingCanvasRef = useRef(null);
  const partsRef         = useRef([]);
  const rafRef           = useRef(null);

  const [stepStates, setStepStates] = useState(Array(5).fill('idle')); // idle | active | done
  const [running,    setRunning]    = useState(false);
  const [heat,       setHeat]       = useState(0);
  const [alt,        setAlt]        = useState(125.0);
  const [liveData,   setLiveData]   = useState({ vel: '—', g: '—', chute: '—' });

  /* ── Particle canvas (confetti on touchdown) ── */
  useEffect(() => {
    const c   = landingCanvasRef.current;
    const ctx = c.getContext('2d');
    const resize = () => { c.width = window.innerWidth; c.height = c.offsetHeight || window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!c.width) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, c.width, c.height);
      for (let i = partsRef.current.length - 1; i >= 0; i--) {
        const p = partsRef.current[i];
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${p.col.join(',')})`; ctx.fill();
        ctx.globalAlpha = 1;
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
        if (p.life <= 0) partsRef.current.splice(i, 1);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const spawnConfetti = () => {
    const c = landingCanvasRef.current;
    for (let i = 0; i < 60; i++) {
      partsRef.current.push({
        x: c.width * 0.5 + rand(-100, 100), y: c.height * 0.8,
        vx: rand(-5, 5), vy: rand(-8, -2),
        life: 90, maxLife: 90,
        col: [Math.round(rand(200,255)), Math.round(rand(80,160)), Math.round(rand(0,50))],
      });
    }
  };

  /* ── Animate a single EDL step ── */
  const animStep = (index) => {
    if (index >= EDL_STEPS.length) { setRunning(false); return; }
    const step = EDL_STEPS[index];

    // mark active
    setStepStates(prev => prev.map((s, i) => i === index ? 'active' : s));

    // Animate heat
    const heatObj = { v: index === 0 ? 0 : EDL_STEPS[index - 1].heat };
    gsap.to(heatObj, {
      v: step.heat, duration: step.delay / 1000 * 0.8, ease: 'power2.inOut',
      onUpdate: () => setHeat(Math.round(heatObj.v)),
    });

    // Animate altitude
    const altObj = { v: index === 0 ? 125 : EDL_STEPS[index - 1].alt };
    gsap.to(altObj, {
      v: step.alt, duration: step.delay / 1000 * 0.9, ease: 'power2.inOut',
      onUpdate: () => setAlt(altObj.v.toFixed(1)),
    });

    setLiveData({ vel: step.vel, g: step.g + ' G', chute: step.chute });

    setTimeout(() => {
      setStepStates(prev => prev.map((s, i) => i === index ? 'done' : s));
      if (index === EDL_STEPS.length - 1) spawnConfetti();
      animStep(index + 1);
    }, step.delay);
  };

  const handleRun = () => {
    if (running) return;
    setRunning(true);
    setStepStates(Array(5).fill('idle'));
    setHeat(0); setAlt(125.0);
    setLiveData({ vel: '—', g: '—', chute: '—' });
    animStep(0);
  };

  const heatPct = Math.min((heat / 1600) * 100, 100);

  return (
    <section id="landing" className="landing">
      <canvas ref={landingCanvasRef} className="landingCanvas" />

      <div className="landingGrid">
        {/* Text column */}
        <div>
          <span className="phase-label reveal" style={{ color: '#FF5E00' }}>Phase 03 — Entry, Descent &amp; Landing</span>
          <h2 className="section-title reveal" style={{ color: '#fff' }}>
            7 MINUTES<br /><span style={{ color: '#FF5E00' }}>OF TERROR</span>
          </h2>
          <p className="section-body reveal">
            Hitting the Martian atmosphere at 20,000 km/h generates 1,600°C on the heat shield.
            No abort option. No manual override. Fully automated — and it works, or it doesn't.
          </p>

          <div className="edlSequence reveal">
            {EDL_STEPS.map((step, i) => (
              <div key={i} className={`edlStep ${stepStates[i]}`}>
                <span className="edlNum">{String(i + 1).padStart(2, '0')}</span>
                <div className="edlInfo">
                  <div className="edlName">{step.name}</div>
                  <div className="edlDetail">{step.detail}</div>
                </div>
                <span className="edlCheck">✓</span>
              </div>
            ))}
          </div>

          <button className="edlBtn reveal" onClick={handleRun} disabled={running}>
            {running ? '⏳ RUNNING SEQUENCE…' : '▶ RUN EDL SEQUENCE'}
          </button>
        </div>

        {/* Gauges column */}
        <div className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Heat gauge */}
          <div className="heatGauge">
            <div className="heatTop">
              <span className="heatTitle">Heat Shield Temperature</span>
              <span className="heatVal">{heat.toLocaleString()}°C</span>
            </div>
            <div className="heatBarWrap">
              <div className="heatBar" style={{ width: `${heatPct}%` }} />
            </div>
          </div>

          {/* Altitude */}
          <div className="data-card">
            <div className="altDisplay">
              <span className="altLbl">Altitude Above Surface</span>
              <span className="altVal">{alt}</span>
              <span className="altUnit">kilometres</span>
            </div>
          </div>

          {/* Live data */}
          <div className="data-card">
            <div className="data-row"><span className="data-key">Entry Angle</span><span className="data-val">−11.5°</span></div>
            <div className="data-row"><span className="data-key">Velocity</span><span className="data-val">{liveData.vel}</span></div>
            <div className="data-row"><span className="data-key">G-Load</span><span className="data-val warn">{liveData.g}</span></div>
            <div className="data-row"><span className="data-key">Chute Status</span><span className="data-val">{liveData.chute}</span></div>
            <div className="data-row"><span className="data-key">Landing Site</span><span className="data-val mars">Jezero Crater</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
