import { useEffect, useRef, useState } from 'react';
import './Hero.css';
import { rand, lerp, createStarField } from '../../../utils/helpers';
import { formatCountdown } from '../../../utils/helpers';

export default function Hero({ onLaunch }) {
  const canvasRef    = useRef(null);
  const earthWrapRef = useRef(null);
  const starsRef     = useRef([]);
  const rafRef       = useRef(null);

  const [counting,  setCounting]  = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [launched,  setLaunched]  = useState(false);

  /* ── Star field canvas ── */
  useEffect(() => {
    const c   = canvasRef.current;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
      starsRef.current = createStarField(350, c.width, c.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      starsRef.current.forEach((s, i) => {
        s.tw += s.ts;
        const a      = s.op * (0.6 + 0.4 * Math.sin(s.tw));
        const pOff   = (i % 3) * s.speed * scrollY * 0.015;
        const y      = (s.y - pOff + c.height) % c.height;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,240,255,${a})`;
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    /* Earth parallax */
    const onScrollEarth = () => {
      if (earthWrapRef.current) {
        earthWrapRef.current.style.transform =
          `translateX(-50%) translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', onScrollEarth, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScrollEarth);
    };
  }, []);

  /* ── Countdown ticker ── */
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setLaunched(true);
          onLaunch?.();
          setTimeout(() => {
            document.getElementById('launch')?.scrollIntoView({ behavior: 'smooth' });
          }, 400);
          return 0;
        }
        return prev - 1;
      });
    }, 60); // sped up for UX
    return () => clearInterval(id);
  }, [counting]);

  const handleLaunchClick = () => {
    if (!counting && !launched) setCounting(true);
  };

  return (
    <section id="hero" className="hero">
      <canvas ref={canvasRef} className="heroCanvas" />

      {/* Earth */}
      <div ref={earthWrapRef} className="earthWrap">
        <div className="earth">
          <div className="earthClouds" />
          <div className="earthAtmo" />
          <div className="terminator" />
        </div>
      </div>

      {/* Content */}
      <div className="heroInner">
        <div className="heroBadge">
          <div className="badgeDot" />
          Live Mission Feed · Kennedy Space Center
        </div>

        <h1 className="heroTitle">
          <span className="lineEarth">EARTH</span>
          <span className="lineTo">to</span>
          <span className="lineMars">MARS</span>
        </h1>

        <p className="heroSubtitle">
          54,600,000 kilometres of silence. One crew. One chance.
        </p>

        <div className="missionStats">
          <div className="mstat">
            <span className="mstatVal" style={{ color: '#4da6ff' }}>253</span>
            <span className="mstatLbl">Transit Days</span>
          </div>
          <div className="mstatSep" />
          <div className="mstat">
            <span className="mstatVal">54.6M</span>
            <span className="mstatLbl">Kilometres</span>
          </div>
          <div className="mstatSep" />
          <div className="mstat">
            <span className="mstatVal" style={{ color: '#E8651A' }}>6</span>
            <span className="mstatLbl">Crew Members</span>
          </div>
          <div className="mstatSep" />
          <div className="mstat">
            <span className="mstatVal">2031</span>
            <span className="mstatLbl">Mission Year</span>
          </div>
        </div>

        <button className="launchBtn" onClick={handleLaunchClick} disabled={launched}>
          <div className="launchArrow" />
          {launched ? 'LAUNCH CONFIRMED' : 'INITIATE LAUNCH SEQUENCE'}
        </button>

        <div className="countdown">
          {launched
            ? <span style={{ color: '#00FF88' }}>✓ LAUNCH CONFIRMED — SCROLL TO FOLLOW MISSION</span>
            : counting
              ? <>STATUS: SYSTEMS NOMINAL · T-MINUS{' '}
                  <span className="countdownVal">{formatCountdown(countdown)}</span>
                </>
              : 'STATUS: AWAITING COMMANDER AUTHORISATION'
          }
        </div>
      </div>

      <div className="heroScroll">
        <span className="scrollText">Scroll to begin</span>
        <div className="scrollMouse">
          <div className="scrollWheel" />
        </div>
      </div>
    </section>
  );
}
