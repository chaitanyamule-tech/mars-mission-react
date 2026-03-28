import { useEffect, useState } from 'react';
import './SideNav.css';

const NAV_ITEMS = [
  { id: 'hero',        label: 'Earth'    },
  { id: 'launch',      label: 'Launch'   },
  { id: 'travel',      label: 'Transit'  },
  { id: 'landing',     label: 'EDL'      },
  { id: 'exploration', label: 'Mars'     },
  { id: 'complete',    label: 'Complete' },
];

const MARS_IDS = new Set(['exploration', 'complete']);

export default function SideNav() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const observers = NAV_ITEMS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sideNav">
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          className={[
            'navItem',
            active === id   ? 'active' : '',
            MARS_IDS.has(id) ? 'mars'  : '',
          ].filter(Boolean).join(' ')}
          onClick={() => scrollTo(id)}
        >
          <div className="navDot" />
          <span className="navLabel">{label}</span>
        </button>
      ))}
    </nav>
  );
}
