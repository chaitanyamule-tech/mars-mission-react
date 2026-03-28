import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Exploration.css';
import { rand, clamp, lerp, generateTerrain, getGroundY } from '../../../utils/helpers';

gsap.registerPlugin(ScrollTrigger);

const CANVAS_H = 380;
const SEG_COUNT = 80;

const DISCOVERY_SITES = [
  { relX: 0.15, label: 'Mineral Deposit',  desc: 'High iron oxide concentration detected. Potential hematite formation.' },
  { relX: 0.42, label: 'Ancient Riverbed', desc: 'Sedimentary layering consistent with fluvial deposit 3.5 billion years old.' },
  { relX: 0.68, label: 'Ice Subsurface',   desc: 'Ground-penetrating radar confirms water ice at 1.2 m depth.' },
  { relX: 0.88, label: 'Fossil Microbes?', desc: 'Carbon isotope ratio anomaly — warrants detailed spectral analysis.' },
];

export default function Exploration() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  // Rover world state kept in refs (no re-render needed every frame)
  const worldXRef    = useRef(0);
  const odomRef      = useRef(0);
  const terrainRef   = useRef([]);
  const dustPartsRef = useRef([]);
  const dustDevilsRef= useRef([]);
  const discoveredRef= useRef(DISCOVERY_SITES.map(d => ({ ...d, found: false })));

  // Keyboard state
  const keysRef = useRef({});

  // React state for the UI panels
  const [solDisplay,   setSolDisplay]   = useState('001');
  const [odomDisplay,  setOdomDisplay]  = useState('0 m');
  const [samples,      setSamples]      = useState(0);
  const [discovery,    setDiscovery]    = useState(null);  // { label, desc } | null

  /* ── Sol counter animation on scroll ── */
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#exploration', start: 'top 70%', once: true,
      onEnter: () => {
        const obj = { v: 1 };
        gsap.to(obj, { v: 187, duration: 2.5, ease: 'power2.out',
          onUpdate: () => setSolDisplay(String(Math.round(obj.v)).padStart(3, '0')),
        });
      },
    });
    return () => st.kill();
  }, []);

  /* ── Keyboard listeners ── */
  useEffect(() => {
    const onDown = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onUp   = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  /* ── Main rover canvas loop ── */
  useEffect(() => {
    const c   = canvasRef.current;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width = c.offsetWidth;
      const segW = c.width / SEG_COUNT;
      if (terrainRef.current.length === 0) {
        terrainRef.current = generateTerrain(0, SEG_COUNT * 3, segW, CANVAS_H);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Dust devil spawner
    const ddTimer = setInterval(() => {
      if (Math.random() > 0.85) {
        dustDevilsRef.current.push({
          x: rand(0, c.width), y: CANVAS_H * 0.55,
          vx: rand(-0.5, 0.5), r: rand(8, 20), life: 200, maxLife: 200,
        });
      }
    }, 3000);

    const ROVER_X = () => c.width * 0.35;

    const draw = () => {
      if (!c.width) { rafRef.current = requestAnimationFrame(draw); return; }
      const W = c.width, H = CANVAS_H;
      ctx.clearRect(0, 0, W, H);

      // ── Sky ──
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1a0804'); sky.addColorStop(0.5, '#2d1205'); sky.addColorStop(1, '#3d1a07');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // faint stars
      ctx.fillStyle = 'rgba(255,240,200,.25)';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 73 + worldXRef.current * 0.02) % W + W) % W;
        const sy = (i * 47) % (H * 0.4);
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
      }

      // ── Distant mountains ──
      ctx.fillStyle = 'rgba(60,20,5,.6)';
      ctx.beginPath(); ctx.moveTo(0, H * 0.55);
      for (let x = 0; x <= W; x += 30) {
        ctx.lineTo(x, H * 0.55 - Math.sin((x + worldXRef.current * 0.08) * 0.022) * 35 - 15);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

      // ── Terrain ──
      const pts = terrainRef.current;
      if (pts.length < 2) { rafRef.current = requestAnimationFrame(draw); return; }

      ctx.beginPath(); ctx.moveTo(0, H);
      let started = false;
      pts.forEach(pt => {
        const sx = pt.x - worldXRef.current;
        if (sx >= -40 && sx <= W + 40) {
          if (!started) { ctx.lineTo(sx, pt.y); started = true; }
          else ctx.lineTo(sx, pt.y);
        }
      });
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      const tg = ctx.createLinearGradient(0, H * 0.5, 0, H);
      tg.addColorStop(0, '#8B3A0F'); tg.addColorStop(0.3, '#6B2A08'); tg.addColorStop(1, '#3A1204');
      ctx.fillStyle = tg; ctx.fill();

      // rock scatter
      ctx.fillStyle = 'rgba(100,45,15,.7)';
      for (let i = 0; i < 25; i++) {
        const rx = ((i * 137 + 100) % W);
        const gy2 = getGroundY(pts, worldXRef.current, rx, H * 0.6);
        ctx.beginPath(); ctx.ellipse(rx, gy2, rand(3, 12), rand(2, 6), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Discovery sites ──
      const worldWidth = W * 4;
      discoveredRef.current.forEach((d, idx) => {
        const worldX2 = d.relX * worldWidth;
        const sx = worldX2 - worldXRef.current;
        if (sx < -30 || sx > W + 30) return;
        const gy2 = getGroundY(pts, worldXRef.current, sx, H * 0.6);

        if (!d.found) {
          const blink = (Math.sin(Date.now() * 0.004) + 1) / 2;
          ctx.beginPath(); ctx.arc(sx, gy2 - 20, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,136,${0.4 + blink * 0.6})`; ctx.fill();
          ctx.beginPath(); ctx.moveTo(sx, gy2 - 12); ctx.lineTo(sx, gy2);
          ctx.strokeStyle = `rgba(0,255,136,${0.4 + blink * 0.6})`; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.font = 'bold 9px Share Tech Mono'; ctx.fillStyle = 'rgba(0,255,136,.7)';
          ctx.textAlign = 'center'; ctx.fillText('?', sx, gy2 - 16); ctx.textAlign = 'left';

          // proximity check
          if (Math.abs(ROVER_X() - sx) < 55) {
            discoveredRef.current[idx] = { ...d, found: true };
            setSamples(s => s + 1);
            setDiscovery({ label: d.label, desc: d.desc });
          }
        } else {
          ctx.font = '9px Share Tech Mono'; ctx.fillStyle = 'rgba(0,255,136,.4)';
          ctx.textAlign = 'center'; ctx.fillText('✓', sx, gy2 - 8); ctx.textAlign = 'left';
        }
      });

      // ── Dust particles ──
      dustPartsRef.current.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife * 0.6;
        ctx.fillStyle = 'rgba(180,100,40,.8)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      for (let i = dustPartsRef.current.length - 1; i >= 0; i--) {
        const p = dustPartsRef.current[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--;
        if (p.life <= 0) dustPartsRef.current.splice(i, 1);
      }

      // ── Dust devils ──
      dustDevilsRef.current.forEach(d => {
        const a = d.life / d.maxLife;
        const g2 = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
        g2.addColorStop(0, `rgba(160,80,30,${a * 0.4})`); g2.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();
      });
      for (let i = dustDevilsRef.current.length - 1; i >= 0; i--) {
        const d = dustDevilsRef.current[i];
        d.x += d.vx; d.y -= 0.3; d.life--; d.r += 0.05;
        if (d.life <= 0) dustDevilsRef.current.splice(i, 1);
      }

      // ── Rover ──
      const roverX = ROVER_X();
      const gy = getGroundY(pts, worldXRef.current, roverX, H * 0.6);
      const gyl = getGroundY(pts, worldXRef.current, roverX - 18, H * 0.6);
      const gyr = getGroundY(pts, worldXRef.current, roverX + 18, H * 0.6);
      const angle = Math.atan2(gyr - gyl, 36) * 0.6;

      ctx.save();
      ctx.translate(roverX, gy - 14);
      ctx.rotate(angle);
      // body
      ctx.fillStyle = '#c8c8c8'; ctx.fillRect(-22, -10, 44, 14);
      // solar panels
      ctx.fillStyle = '#2244aa';
      ctx.fillRect(-34, -15, 16, 6); ctx.fillRect(18, -15, 16, 6);
      // panel lines
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 0.8;
      [-30, -26, -22].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -15); ctx.lineTo(x, -9); ctx.stroke(); });
      [22, 26, 30].forEach(x => { ctx.beginPath(); ctx.moveTo(x, -15); ctx.lineTo(x, -9); ctx.stroke(); });
      // mast
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(4, -24); ctx.stroke();
      ctx.beginPath(); ctx.arc(4, -24, 3, 0, Math.PI * 2); ctx.fillStyle = '#888'; ctx.fill();
      // wheels
      [[-16, 2], [-8, 3], [0, 4], [8, 3], [16, 2]].forEach(([wx, wy]) => {
        ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#555'; ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
      });
      // arm
      ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-30, 4); ctx.stroke();
      ctx.beginPath(); ctx.arc(-30, 4, 2, 0, Math.PI * 2); ctx.fillStyle = '#00FF88'; ctx.fill();
      ctx.restore();

      // ── Rover controls ──
      const k = keysRef.current;
      const speed = 2.5;
      const movL = k['arrowleft']  || k['a'];
      const movR = k['arrowright'] || k['d'];
      const movF = k['arrowup']    || k['w'];
      const movB = k['arrowdown']  || k['s'];

      if (movL) { worldXRef.current -= speed; odomRef.current += speed; }
      if (movR) { worldXRef.current += speed; odomRef.current += speed; }
      if (movF) { worldXRef.current += speed * 0.5; odomRef.current += speed * 0.5; }
      if (movB) { worldXRef.current -= speed * 0.5; odomRef.current += speed * 0.5; }
      worldXRef.current = Math.max(0, worldXRef.current);

      // spawn dust
      if ((movL || movR || movF || movB) && Math.random() > 0.5) {
        dustPartsRef.current.push({
          x: roverX + rand(-20, 20), y: gy + rand(-5, 5),
          vx: rand(-1, 1) * (movR ? -1 : 1), vy: rand(-1.5, -0.3),
          r: rand(1, 4), life: 30, maxLife: 30,
        });
      }

      // extend terrain
      const last = terrainRef.current[terrainRef.current.length - 1];
      if (last && last.x - worldXRef.current < W + 200) {
        const segW = W / SEG_COUNT;
        const ext = generateTerrain(last.x, SEG_COUNT, segW, H);
        terrainRef.current = terrainRef.current.concat(ext.slice(1));
      }

      // update odometer display (throttled via ref comparison)
      setOdomDisplay(Math.round(odomRef.current / 10) + ' m');

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(ddTimer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  /* ── Touch drag ── */
  const touchStartRef = useRef(null);
  const onTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const onTouchMove  = (e) => {
    if (touchStartRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartRef.current;
    worldXRef.current = Math.max(0, worldXRef.current - dx * 0.4);
    odomRef.current += Math.abs(dx) * 0.4;
    touchStartRef.current = e.touches[0].clientX;
  };

  return (
    <section id="exploration" className="exploration">
      <div className="marsSky" />

      <div className="explorationInner">
        <div className="explorationGrid">
          {/* Left panel */}
          <div>
            <span className="phase-label reveal" style={{ color: '#E8651A' }}>Phase 04 — Surface Operations</span>

            <div className="solCounter reveal">
              <span className="solVal">{solDisplay}</span>
              <span className="solLabel">Mars Sol</span>
            </div>

            <h2 className="section-title reveal" style={{ color: '#E8651A', fontSize: 'clamp(2.5rem,7vw,6rem)', marginBottom: 14 }}>
              EXPLORE<br />MARS
            </h2>

            <p className="section-body reveal" style={{ marginBottom: 20 }}>
              Jezero Crater — once a lake bed 3.5 billion years ago. Drive the ARES rover across
              the rust-coloured regolith. Analyse rock samples. Search for signs of ancient microbial life.
            </p>

            <div className={`discoveryPanel reveal${discovery ? ' found' : ''}`}>
              {discovery ? (
                <>
                  <div className="discoveryTitle">🔬 {discovery.label}</div>
                  <div className="discoveryBody">{discovery.desc}</div>
                </>
              ) : (
                <>
                  <div className="discoveryTitle">Drive the Rover →</div>
                  <div className="discoveryBody">Use WASD or Arrow Keys. Approach glowing markers to analyse discovery sites.</div>
                </>
              )}
            </div>

            <div className="marsStats reveal">
              {[
                { val: '−63°C',   lbl: 'Avg Temperature' },
                { val: '0.6%',    lbl: 'O₂ Atmosphere'   },
                { val: '3.7 m/s²',lbl: 'Gravity'         },
                { val: '24h 37m', lbl: 'Martian Day'      },
                { val: odomDisplay,  lbl: 'Rover Distance' },
                { val: samples,   lbl: 'Samples Collected' },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="marsStat">
                  <span className="msVal">{val}</span>
                  <span className="msLbl">{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rover canvas */}
          <div className="reveal">
            <div className="roverCanvasWrap">
              <canvas
                ref={canvasRef}
                className="roverCanvas"
                height={CANVAS_H}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
              />
            </div>
            <div className="controlsHint">
              {['W', 'A', 'S', 'D'].map(k => <span key={k} className="keyBadge">{k}</span>)}
              <span className="ctrlLabel">or</span>
              {['↑', '←', '↓', '→'].map(k => <span key={k} className="keyBadge">{k}</span>)}
              <span className="ctrlLabel">to drive rover</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
