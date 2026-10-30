import React, { useState } from 'react';
import { PlatformEventType } from '../engine/platformBus';

export interface RecordedPlatformEvent {
  id: string;
  type: PlatformEventType;
  senderProduct: string;
  senderPort?: number;
  timestamp: string;
  summary: string;
  severity: 'critical' | 'warning' | 'info';
  payloadJson: string;
}

interface PlatformEventStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: RecordedPlatformEvent[];
  onClearEvents: () => void;
}

export const PlatformEventStreamModal: React.FC<PlatformEventStreamModalProps> = ({
  isOpen,
  onClose,
  events,
  onClearEvents,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredEvents = filterType === 'ALL'
    ? events
    : events.filter((e) => e.type === filterType);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'CRITICAL' };
      case 'warning':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'WARNING' };
      default:
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'INFO' };
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-stream-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '20px',
      }}
    >
      <div
        className="modal-container"
        style={{
          background: '#ffffff',
          borderRadius: 12,
          maxWidth: 920,
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 id="platform-stream-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Cross-Tab Platform Mesh Stream
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 9999,
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                }}
              >
                ● LIVE BROADCASTCHANNEL MESH
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
              Real-time reactive synchronization across ports 5170–5180 without network polling.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#64748b',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Controls & Stats Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Filter Type:</span>
            {['ALL', 'SAFETY_ALERT', 'PRICING_UPDATED', 'HOS_SCHEDULE_UPDATED', 'CARGO_LOAD_UPDATED', 'ORDER_SELECTED'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: filterType === t ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: filterType === t ? '#e0f2fe' : '#ffffff',
                  color: filterType === t ? '#0369a1' : '#64748b',
                  fontWeight: filterType === t ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={onClearEvents}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear Log ({events.length})
          </button>
        </div>

        {/* Scrollable Event List */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No Platform Events Recorded</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                As you navigate through Cargo Fit, Freight Pricing, HOS Planner, Telematics, or Carrier Trust, cross-tab events will appear here in real time.
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const sev = getSeverityBadge(evt.severity);
              return (
                <div
                  key={evt.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: sev.bg,
                          color: sev.color,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        {sev.label}
                      </span>
                      <strong style={{ fontSize: 12, color: '#1e293b' }}>{evt.type}</strong>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        from <b>{evt.senderProduct}</b> {evt.senderPort ? `(Port ${evt.senderPort})` : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                    {evt.summary}
                  </div>

                  <details style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Raw Event Payload</summary>
                    <pre
                      style={{
                        margin: '6px 0 0',
                        padding: '8px 10px',
                        background: '#f1f5f9',
                        borderRadius: 6,
                        overflowX: 'auto',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#0f172a',
                      }}
                    >
                      {evt.payloadJson}
                    </pre>
                  </details>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Listening on <code>BroadcastChannel('trucking-platform-mesh-v1')</code>
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
