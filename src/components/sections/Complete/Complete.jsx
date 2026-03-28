import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Complete.css';
import { rand, createStarField, drawStars } from '../../../utils/helpers';

gsap.registerPlugin(ScrollTrigger);

export default function Complete() {
  const canvasRef  = useRef(null);
  const starsRef   = useRef([]);
  const confettiRef= useRef([]);
  const rafRef     = useRef(null);

  useEffect(() => {
    const c   = canvasRef.current;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width  = window.innerWidth;
      c.height = c.offsetHeight || window.innerHeight;
      starsRef.current = createStarField(400, c.width, c.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!c.width) { rafRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, c.width, c.height);
      drawStars(ctx, starsRef.current, c.width, c.height);

      // confetti
      for (let i = confettiRef.current.length - 1; i >= 0; i--) {
        const p = confettiRef.current[i];
        const a = p.life / p.maxLife;
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${p.col.join(',')})`; ctx.fill();
        ctx.globalAlpha = 1;
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.life--;
        if (p.life <= 0) confettiRef.current.splice(i, 1);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    // Confetti burst on enter
    const st = ScrollTrigger.create({
      trigger: '#complete', start: 'top 80%', once: true,
      onEnter: () => {
        for (let i = 0; i < 80; i++) {
          confettiRef.current.push({
            x: rand(0, c.width),
            y: rand(-50, 0),
            vx: rand(-2, 2),
            vy: rand(2, 6),
            r: rand(2, 5),
            life: 160, maxLife: 160,
            col: [Math.round(rand(200,255)), Math.round(rand(60,160)), Math.round(rand(0,60))],
          });
        }
      },
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      st.kill();
      window.removeEventListener('resize', resize);
    };
  }, []);

  const scrollToTop = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="complete" className="complete">
      <canvas ref={canvasRef} className="completeCanvas" />

      <div className="completeInner">
        <div className="completePatch reveal">
          <div className="patchInner">ARES I<br />MARS<br />2031</div>
        </div>

        <h2 className="completeTitle reveal">
          <span style={{ color: '#E8651A' }}>MISSION</span><br />
          <span style={{ color: '#fff' }}>ACCOMPLISHED</span>
        </h2>

        <p className="completeBody reveal">
          "That's one small step for a human, one giant leap for a multiplanetary species."
          The first humans on Mars. History written 54.6 million kilometres from home.
        </p>

        <div className="statGrid reveal">
          {[
            { val: '253',   color: '#4da6ff', lbl: 'Days in Transit'   },
            { val: '54.6M', color: '#fff',    lbl: 'Kilometres'        },
            { val: '6',     color: '#E8651A', lbl: 'Crew Members'      },
            { val: '1st',   color: '#00FF88', lbl: 'Humans on Mars'    },
          ].map(({ val, color, lbl }) => (
            <div key={lbl} className="statBlock">
              <span className="sbVal" style={{ color }}>{val}</span>
              <span className="sbLbl">{lbl}</span>
            </div>
          ))}
        </div>

        <button className="restartBtn reveal" onClick={scrollToTop}>
          ↑ REPLAY MISSION
        </button>
      </div>
    </section>
  );
}
