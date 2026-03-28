import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Global styles
import './styles/globals.css';

// Layout / chrome
import Loader      from './components/Loader/Loader';
import Cursor      from './components/Cursor/Cursor';
import HUD         from './components/HUD/HUD';
import ProgressBar from './components/ProgressBar/ProgressBar';
import SideNav     from './components/SideNav/SideNav';

// Sections
import Hero        from './components/sections/Hero/Hero';
import Launch      from './components/sections/Launch/Launch';
import Travel      from './components/sections/Travel/Travel';
import Landing     from './components/sections/Landing/Landing';
import Exploration from './components/sections/Exploration/Exploration';
import Complete    from './components/sections/Complete/Complete';

gsap.registerPlugin(ScrollTrigger);

// Phases in order with their section IDs
const PHASES = [
  { id: 'hero',        label: 'Pre-Launch'         },
  { id: 'launch',      label: 'Ascent Phase'        },
  { id: 'travel',      label: 'Deep Space Transit'  },
  { id: 'landing',     label: 'EDL Sequence'        },
  { id: 'exploration', label: 'Surface Operations'  },
  { id: 'complete',    label: 'Mission Complete'     },
];

const MARS_PHASES = new Set(['exploration', 'complete']);

export default function App() {
  const [loaded,      setLoaded]      = useState(false);
  const [phase,       setPhase]       = useState('Pre-Launch');
  const [marsPhase,   setMarsPhase]   = useState(false);
  const [launchActive,setLaunchActive]= useState(false);

  // GSAP ScrollTrigger reveal — runs once DOM is ready after load
  useEffect(() => {
    if (!loaded) return;

    // Give one tick for sections to mount
    requestAnimationFrame(() => {
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 36 },
          {
            opacity: 1, y: 0, duration: 0.95, ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Phase observer — drives HUD label + mars cursor
      const observers = PHASES.map(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const obs = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setPhase(label);
              setMarsPhase(MARS_PHASES.has(id));
            }
          },
          { threshold: 0.4 }
        );
        obs.observe(el);
        return obs;
      });

      return () => observers.forEach(o => o?.disconnect());
    });
  }, [loaded]);

  const handleLaunch = () => {
    setLaunchActive(true);
  };

  return (
    <>
      {/* Loading screen */}
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      {/* Global chrome (always mounted so cursor works during load) */}
      <Cursor marsCursor={marsPhase} />
      <ProgressBar marsPhase={marsPhase} />
      <HUD phase={phase} marsPhase={marsPhase} />
      <SideNav />

      {/* Sections */}
      <main>
        <Hero onLaunch={handleLaunch} />
        <div className="sec-div" />

        <Launch active={launchActive} />
        <div className="sec-div" />

        <Travel />
        <div className="sec-div" />

        <Landing />
        <div className="sec-div" />

        <Exploration />
        <div className="sec-div" />

        <Complete />
      </main>
    </>
  );
}
