import { useState, useEffect, useRef } from 'react';
import './Loader.css';

const BOOT_LINES = [
  'Pressurizing fuel tanks…',
  'Raptor engine pre-chill…',
  'Navigation system calibrated',
  'Life support O₂: nominal',
  'Crew aboard · hatches sealed',
  'Ground control confirmation received',
  'Launch window: T-10 minutes',
  'All systems GO',
];

export default function Loader({ onComplete }) {
  const [lines,   setLines]   = useState([]);
  const [filling, setFilling] = useState(false);
  const [out,     setOut]     = useState(false);
  const fillRef  = useRef(null);

  useEffect(() => {
    // Start fill bar
    requestAnimationFrame(() => setFilling(true));

    // Boot sequence
    let i = 0;
    const seq = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]]);
        i++;
      }
    }, 280);

    // Dismiss after 3s
    const dismiss = setTimeout(() => {
      clearInterval(seq);
      setOut(true);
      setTimeout(() => onComplete?.(), 800);
    }, 3000);

    return () => { clearInterval(seq); clearTimeout(dismiss); };
  }, []); // eslint-disable-line

  return (
    <div className={`loader${out ? ' out' : ''}`}>
      <div className="loaderLogo">MISSION ARES I</div>
      <div className="loaderSub">Earth to Mars · Mission Briefing</div>
      <div className="loaderBar">
        <div
          ref={fillRef}
          className="loaderFill"
          style={{ width: filling ? '100%' : '0%' }}
        />
      </div>
      <div className="loaderSeq">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
