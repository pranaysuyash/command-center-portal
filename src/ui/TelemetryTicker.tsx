import React, { useState, useEffect } from 'react';

interface TickerAlert {
  id: string;
  unit: string;
  driver: string;
  timestamp: string;
  type: 'speed' | 'temp' | 'hos' | 'geofence' | 'dtc';
  text: string;
  severity: 'info' | 'warning' | 'normal';
}

const SAMPLE_ALERTS: TickerAlert[] = [
  { id: '1', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:15:02', type: 'geofence', text: 'Entered I-80 PA Turnpike Toll Zone (MP 162) · 66.8 mph · Heading 094° East', severity: 'normal' },
  { id: '2', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:15:30', type: 'temp', text: 'Reefer Zone 1 Temperature: -9.8°F (Setpoint -10.0°F) · Continuous Mode Active', severity: 'normal' },
  { id: '3', unit: 'UNIT-101', driver: 'E. Rostova', timestamp: '12:16:11', type: 'hos', text: 'FMCSA Rest Clock: 3h 12m drive remaining before required 30m break', severity: 'info' },
  { id: '4', unit: 'UNIT-108', driver: 'K. Kowalski', timestamp: '12:16:45', type: 'speed', text: 'Corridor Cruise Active · 65.0 mph · Avg Fuel Economy 6.8 MPG · DEF 88%', severity: 'normal' },
  { id: '5', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:17:15', type: 'geofence', text: 'Approaching Weigh Station (Breezewood, PA) · PrePass Green Light Received', severity: 'info' },
];

export const TelemetryTicker: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SAMPLE_ALERTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const alert = SAMPLE_ALERTS[currentIdx];

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'temp': return '#38bdf8';
      case 'hos': return '#f59e0b';
      case 'geofence': return '#10b981';
      case 'dtc': return '#f43f5e';
      default: return '#c084fc';
    }
  };

  return (
    <div className="telemetry-ticker-bar">
      <div className="ticker-label-badge">
        <span className="live-pulse" />
        <span>LIVE TELEMETRY</span>
      </div>

      <div className="ticker-content-box">
        <span
          className="ticker-type-pill"
          style={{ background: `${getBadgeColor(alert.type)}22`, color: getBadgeColor(alert.type), borderColor: `${getBadgeColor(alert.type)}55` }}
        >
          {alert.type.toUpperCase()}
        </span>
        <strong className="ticker-unit-name">{alert.unit} ({alert.driver})</strong>
        <span className="ticker-text-body">{alert.text}</span>
        <span className="ticker-timestamp">{alert.timestamp} UTC</span>
      </div>

      <div className="ticker-indicators">
        {SAMPLE_ALERTS.map((_, idx) => (
          <span
            key={idx}
            className={`ticker-pip ${idx === currentIdx ? 'active' : ''}`}
            onClick={() => setCurrentIdx(idx)}
          />
        ))}
      </div>
    </div>
  );
};
