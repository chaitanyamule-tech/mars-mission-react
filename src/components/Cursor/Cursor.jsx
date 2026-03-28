import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Cursor.css?inline';
import './Cursor.css';

export default function Cursor({ marsCursor = false }) {
  const wrapRef  = useRef(null);
  const posRef   = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRef= useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef   = useRef(null);
  const [clicked, setClicked]= useState(false);

  // Smooth follow loop
  useEffect(() => {
    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      // Direct dot position
      if (wrapRef.current) {
        wrapRef.current.style.left = e.clientX + 'px';
        wrapRef.current.style.top  = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const onDown = () => setClicked(true);
    const onUp   = () => setClicked(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const cls = [
    'cursorWrap',
    marsCursor ? 'marsCursor' : '',
    clicked     ? 'clicked'   : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={wrapRef} className={cls} style={{ position: 'fixed', left: -100, top: -100 }}>
      <div className="curH" />
      <div className="curV" />
      <div className="curRing" />
      <div className="curDot" />
    </div>
  );
}
