import { useState, useEffect } from 'react';
import './ProgressBar.css';

export default function ProgressBar({ marsPhase = false }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total    = document.documentElement.scrollHeight - window.innerHeight;
      setWidth(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`progressBar${marsPhase ? ' mars' : ''}`}
      style={{ width: `${width}%` }}
    />
  );
}
