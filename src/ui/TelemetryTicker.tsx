import React, { useState, useEffect } from 'react';
import type { RecordedPlatformEvent } from './PlatformEventStreamModal';

interface TickerAlert {
  id: string;
  unit: string;
  driver: string;
  timestamp: string;
  type: 'speed' | 'temp' | 'hos' | 'geofence' | 'dtc' | 'mesh';
  text: string;
  severity: 'info' | 'warning' | 'normal' | 'critical';
}

const SAMPLE_ALERTS: TickerAlert[] = [
  { id: '1', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:15:02', type: 'geofence', text: 'Entered I-80 PA Turnpike Toll Zone (MP 162) · 66.8 mph · Heading 094° East', severity: 'normal' },
  { id: '2', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:15:30', type: 'temp', text: 'Reefer Zone 1 Temperature: -9.8°F (Setpoint -10.0°F) · Continuous Mode Active', severity: 'normal' },
  { id: '3', unit: 'UNIT-101', driver: 'E. Rostova', timestamp: '12:16:11', type: 'hos', text: 'FMCSA Rest Clock: 3h 12m drive remaining before required 30m break', severity: 'info' },
  { id: '4', unit: 'UNIT-108', driver: 'K. Kowalski', timestamp: '12:16:45', type: 'speed', text: 'Corridor Cruise Active · 65.0 mph · Avg Fuel Economy 6.8 MPG · DEF 88%', severity: 'normal' },
  { id: '5', unit: 'UNIT-104', driver: 'M. Vance', timestamp: '12:17:15', type: 'geofence', text: 'Approaching Weigh Station (Breezewood, PA) · PrePass Green Light Received', severity: 'info' },
];

interface TelemetryTickerProps {
  liveEvents?: RecordedPlatformEvent[];
  onOpenEventStream?: () => void;
}

export const TelemetryTicker: React.FC<TelemetryTickerProps> = ({
  liveEvents = [],
  onOpenEventStream,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Merge live events or fallback to samples
  const activeAlerts: TickerAlert[] = liveEvents.length > 0
    ? liveEvents.slice(0, 10).map((e) => ({
        id: e.id,
        unit: e.senderProduct.replace('product-', 'P').toUpperCase(),
        driver: `Port ${e.senderPort ?? 'MESH'}`,
        timestamp: new Date(e.timestamp).toLocaleTimeString(),
        type: 'mesh',
        text: e.summary,
        severity: e.severity === 'critical' ? 'critical' : e.severity === 'warning' ? 'warning' : 'info',
      }))
    : SAMPLE_ALERTS;

  useEffect(() => {
    if (activeAlerts.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeAlerts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeAlerts.length]);

  const alert = activeAlerts[currentIdx] || SAMPLE_ALERTS[0];

  const getBadgeColor = (type: string, severity?: string) => {
    if (severity === 'critical') return '#ef4444';
    if (severity === 'warning') return '#f59e0b';
    switch (type) {
      case 'temp': return '#38bdf8';
      case 'hos': return '#f59e0b';
      case 'geofence': return '#10b981';
      case 'dtc': return '#f43f5e';
      case 'mesh': return '#0284c7';
      default: return '#c084fc';
    }
  };

  const badgeColor = getBadgeColor(alert.type, alert.severity);

  return (
    <div className="telemetry-ticker-bar">
      <div className="ticker-label-badge">
        <span className="live-pulse" />
        <span>{liveEvents.length > 0 ? 'LIVE PLATFORM MESH' : 'SAMPLE TELEMETRY'}</span>
      </div>

      <div className="ticker-content-box" aria-live="polite" role="status" aria-atomic="true">
        <span
          className="ticker-type-pill"
          style={{ background: `${badgeColor}22`, color: badgeColor, borderColor: `${badgeColor}55` }}
        >
          {alert.type.toUpperCase()}
        </span>
        <strong className="ticker-unit-name">{alert.unit} ({alert.driver})</strong>
        <span className="ticker-text-body">{alert.text}</span>
        <span className="ticker-timestamp">{alert.timestamp}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onOpenEventStream && (
          <button
            onClick={onOpenEventStream}
            style={{
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Mesh Stream ({liveEvents.length}) ⚡
          </button>
        )}

        <div className="ticker-indicators">
          {activeAlerts.slice(0, 5).map((_, idx) => (
            <span
              key={idx}
              className={`ticker-pip ${idx === currentIdx ? 'active' : ''}`}
              onClick={() => setCurrentIdx(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
