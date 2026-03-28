import './HUD.css';
import { useMissionTimer } from '../../hooks/useMissionTimer';

export default function HUD({ phase = 'Pre-Launch', marsPhase = false }) {
  const time = useMissionTimer();

  return (
    <div className="hudBar">
      <div className="hudMission">MISSION ARES I</div>
      <div className="hudTime">{time}</div>
      <div className={`hudPhase${marsPhase ? ' mars' : ''}`}>{phase}</div>
    </div>
  );
}
