import React from 'react';
import type { RecordedPlatformEvent } from './PlatformEventStreamModal';

export interface ExceptionItem {
  id: string;
  sourceProduct: string;
  sourceCode: string;
  port: number;
  category: 'HOS' | 'AXLE_LOAD' | 'COLD_CHAIN' | 'CARRIER_FRAUD' | 'YARD_DETENTION' | 'ENGINE_DTC';
  severity: 'critical' | 'warning';
  title: string;
  detail: string;
  timestamp: string;
  targetUrl: string;
}

interface ExceptionControlTowerProps {
  liveEvents: RecordedPlatformEvent[];
  onNavigateStage?: (stageId: string) => void;
}

export const ExceptionControlTower: React.FC<ExceptionControlTowerProps> = ({
  liveEvents,
}) => {
  // Extract critical & warning events from platform mesh
  const meshExceptions: ExceptionItem[] = liveEvents
    .filter((e) => e.severity === 'critical' || e.severity === 'warning')
    .slice(0, 5)
    .map((e) => ({
      id: e.id,
      sourceProduct: e.senderProduct,
      sourceCode: e.senderProduct.toUpperCase().slice(0, 3),
      port: e.senderPort || 5170,
      category: e.type.includes('HOS')
        ? 'HOS'
        : e.type.includes('CARGO')
        ? 'AXLE_LOAD'
        : e.type.includes('SAFETY')
        ? 'CARRIER_FRAUD'
        : 'ENGINE_DTC',
      severity: e.severity as 'critical' | 'warning',
      title: e.type.replace(/_/g, ' '),
      detail: e.summary,
      timestamp: e.timestamp,
      targetUrl: `http://localhost:${e.senderPort || 5170}/`,
    }));

  // Baseline simulated exceptions ensuring operational readiness
  const baselineExceptions: ExceptionItem[] = [
    {
      id: 'ex-cold-chain-01',
      sourceProduct: 'Product 05 Telematics',
      sourceCode: 'P05',
      port: 5177,
      category: 'COLD_CHAIN',
      severity: 'critical',
      title: 'Zone 1 Temperature Excursion (+4.2°F)',
      detail: 'Reefer setpoint -10.0°F, actual return air -5.8°F. Potential frozen food defrost hazard.',
      timestamp: new Date().toISOString(),
      targetUrl: 'http://localhost:5177/?alert=excursion&unit=TRK-104',
    },
    {
      id: 'ex-yard-detention-02',
      sourceProduct: 'Product 07 Yard & Dock',
      sourceCode: 'P07',
      port: 5179,
      category: 'YARD_DETENTION',
      severity: 'warning',
      title: 'Dock Door #01 Detention Free-Time Expiring',
      detail: 'Trailer TLR-7701-RF dwell time 105 mins. Free time expires in 15 mins ($75/hr detention kicks in).',
      timestamp: new Date().toISOString(),
      targetUrl: 'http://localhost:5179/?door=DOOR-01',
    },
  ];

  const allExceptions = [...meshExceptions, ...baselineExceptions].slice(0, 4);

  return (
    <div
      className="dossier-card"
      style={{
        border: '1px solid rgba(244, 63, 94, 0.4)',
        background: 'linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ margin: 0, color: '#fb7185', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🚨</span> Exception Control Tower
        </h4>
        <span
          style={{
            background: '#f43f5e',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: 10,
          }}
        >
          {allExceptions.length} ACTIVE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allExceptions.map((ex) => (
          <div
            key={ex.id}
            style={{
              padding: '8px 10px',
              borderRadius: 6,
              background: ex.severity === 'critical' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              borderLeft: `3px solid ${ex.severity === 'critical' ? '#f43f5e' : '#f59e0b'}`,
              fontSize: 11,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#f8fafc' }}>{ex.title}</span>
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                {ex.sourceCode} :{ex.port}
              </span>
            </div>
            <div style={{ color: '#cbd5e1', margin: '3px 0 6px', fontSize: 11, lineHeight: 1.3 }}>
              {ex.detail}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a
                href={ex.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                Inspect in {ex.sourceCode} ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
