import React, { useState } from 'react';
import { LifecycleStageId, FreightOrderSpec } from '../engine/types';
import {
  IconTruck,
  IconClock,
  IconDollar,
  IconPackage,
  IconBuilding,
  IconShieldAlert,
  IconClipboard,
  IconZap,
} from './icons';

export type PersonaRoleId =
  | 'PER-950374'  // Marcus Vance: Fleet Operations Manager
  | 'PER-RT-0101' // Hank Reynolds: Independent Owner-Operator
  | 'PER-RT-0104' // Commercial 3PL Freight Broker
  | 'Javier Ortiz'// Javier Ortiz: Warehouse & Yard Flow Lead
  | 'PER-RT-0103';// Inspector Dale Bradley: FMCSA / CVSA Regulatory Safety Auditor

export interface RoleQuickAction {
  id: string;
  label: string;
  targetStage: LifecycleStageId;
  description: string;
  iconType: 'truck' | 'dollar' | 'clock' | 'package' | 'building' | 'shield' | 'zap';
}

export interface RoleFocalMetric {
  label: string;
  value: string;
  unit: string;
  status: 'optimal' | 'warning' | 'neutral';
  regulationOrRef: string;
}

export interface PersonaRoleDefinition {
  id: PersonaRoleId;
  name: string;
  roleTitle: string;
  badgeCode: string;
  organization: string;
  avatarColor: string;
  mandate: string;
  touchstone: string;
  priorityStages: LifecycleStageId[];
  focalMetrics: (order: FreightOrderSpec) => RoleFocalMetric[];
  quickActions: RoleQuickAction[];
}

export const PERSONA_ROLES: PersonaRoleDefinition[] = [
  {
    id: 'PER-950374',
    name: 'Marcus Vance',
    roleTitle: 'VP of Fleet & Terminal Operations',
    badgeCode: 'OPS-DIR',
    organization: 'NorthLine Logistics / Fleet Control',
    avatarColor: '#38bdf8', // Sky blue
    mandate: 'Turnaround velocity, dispatch friction, cross-product handoffs, fleet asset utilization, and detention cost avoidance.',
    touchstone: 'FMCSR Part 390 (Carrier Safety Responsibilities) · Terminal KPI Throughput · $85/hr Detention Avoidance',
    priorityStages: ['asset_studio', 'yard_dock', 'fleet_telematics'],
    focalMetrics: (order) => [
      {
        label: 'Fleet Equipment Match',
        value: order.vehicleName.split(' ')[0] || 'Class 8',
        unit: 'Assigned',
        status: 'optimal',
        regulationOrRef: 'Asset Studio P04',
      },
      {
        label: 'Payload Capacity Utilization',
        value: ((order.totalPayloadLbs / order.maxPayloadLbs) * 100).toFixed(1),
        unit: '% Gross',
        status: order.totalPayloadLbs <= order.maxPayloadLbs ? 'optimal' : 'warning',
        regulationOrRef: 'Max 45,000 lbs Rating',
      },
      {
        label: 'Turnaround Dwell Target',
        value: '1.5',
        unit: 'hrs',
        status: 'optimal',
        regulationOrRef: '< 2.0h Free Time Limit',
      },
      {
        label: 'En-Route Telematics Status',
        value: 'ONLINE',
        unit: 'OBD-II',
        status: 'optimal',
        regulationOrRef: 'SAE J1939 CAN Bus (P05)',
      },
    ],
    quickActions: [
      {
        id: 'act-fleet-studio',
        label: 'Inspect Equipment Twin & Drag (P04)',
        targetStage: 'asset_studio',
        description: 'Verify aerodynamic fairings, tire inflation, and tare weight credits.',
        iconType: 'truck',
      },
      {
        id: 'act-yard-dock',
        label: 'Open Yard Gate & Detention HUD (P07)',
        targetStage: 'yard_dock',
        description: 'Monitor dock door occupancy and hostler anti-deadhead jockey moves.',
        iconType: 'building',
      },
      {
        id: 'act-telematics',
        label: 'Live Telematics & Reefer Feed (P05)',
        targetStage: 'fleet_telematics',
        description: 'Track GPS corridor waypoints, 18-wheel TPMS, and reefer return-air temperatures.',
        iconType: 'zap',
      },
    ],
  },
  {
    id: 'PER-RT-0101',
    name: 'Hank Reynolds',
    roleTitle: 'Independent OTR Owner-Operator',
    badgeCode: 'OWNER-OP',
    organization: 'Reynolds Freight & Transport (Independent CDL-A)',
    avatarColor: '#10b981', // Emerald green
    mandate: 'Practical cab usability, net profit per mile, weigh station bypass, honest fuel pass-through, HOS duty clock flexibility.',
    touchstone: '49 CFR Part 395 (Hours of Service & Split Sleeper) · EIA Weekly Diesel Escalator · CAT Scale Certified Weights',
    priorityStages: ['cargo_fit', 'freight_pricing', 'hos_planner'],
    focalMetrics: (order) => [
      {
        label: 'Net Loaded Rate',
        value: `$${order.ratePerMile.toFixed(2)}`,
        unit: '/ mi',
        status: order.ratePerMile >= 2.5 ? 'optimal' : 'warning',
        regulationOrRef: 'Operating Break-Even: $1.95/mi',
      },
      {
        label: 'EIA Diesel Surcharge',
        value: `$${order.fuelSurcharge}`,
        unit: 'Total',
        status: 'optimal',
        regulationOrRef: 'DOE Weekly Regional Index Peg',
      },
      {
        label: 'Available Driving Clock',
        value: `${Math.max(0, 11 - Math.min(11, order.transitHoursTotal)).toFixed(1)}`,
        unit: 'hrs left',
        status: order.transitHoursTotal <= 11 ? 'optimal' : 'warning',
        regulationOrRef: '49 CFR § 395.3(a)(3) 11h Limit',
      },
      {
        label: 'Tandem Bridge Law Status',
        value: 'LEGAL',
        unit: 'Hole 6',
        status: 'optimal',
        regulationOrRef: 'KPRA <= 40ft (CA STAA)',
      },
    ],
    quickActions: [
      {
        id: 'act-tandem-slider',
        label: 'Balance Tandem Axles (P01)',
        targetStage: 'cargo_fit',
        description: 'Slide trailer tandem pins to balance drive and tandem axles under 34,000 lbs.',
        iconType: 'truck',
      },
      {
        id: 'act-triangulation',
        label: 'Analyze 3-Leg Backhaul Route (P02)',
        targetStage: 'freight_pricing',
        description: 'Triangulate return lanes to eliminate empty deadhead miles and maximize profit.',
        iconType: 'dollar',
      },
      {
        id: 'act-hos-recap',
        label: 'Check 8-Day HOS Recap & Parking (P03)',
        targetStage: 'hos_planner',
        description: 'Review 70h/8d duty cycle, 34-hour restart advisory, and corridor rest stops.',
        iconType: 'clock',
      },
    ],
  },
  {
    id: 'PER-RT-0104',
    name: '3PL Operations Desk',
    roleTitle: 'Commercial Freight Broker & Logistics Lead',
    badgeCode: 'BROKER-3PL',
    organization: 'Apex Logistics Freight Exchange (Licensed Property Broker)',
    avatarColor: '#f59e0b', // Amber
    mandate: 'Spot rate confirmations, brokerage gross margin (15% target), accessorial rate cards, EDI 204/990/214/210 integrity, carrier vetting.',
    touchstone: '49 U.S.C. § 13906 (BMC-84 $75k Bond) · ANSI X12 EDI 204/990/214/210 · MAP-21 Anti-Double Brokering',
    priorityStages: ['freight_pricing', 'carrier_trust'],
    focalMetrics: (order) => {
      const grossRev = Math.round(order.totalCarrierPay * 1.18);
      const marginDollar = grossRev - order.totalCarrierPay;
      const marginPct = ((marginDollar / grossRev) * 100).toFixed(1);
      return [
        {
          label: 'Brokerage Gross Margin',
          value: `${marginPct}%`,
          unit: `$${marginDollar}`,
          status: parseFloat(marginPct) >= 15 ? 'optimal' : 'neutral',
          regulationOrRef: 'Target Spread: >= 15.0%',
        },
        {
          label: 'Total Carrier Settlement',
          value: `$${order.totalCarrierPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          unit: 'USD',
          status: 'optimal',
          regulationOrRef: 'Includes EIA Surcharge & Accessorials',
        },
        {
          label: 'Carrier Anti-Fraud Status',
          value: 'VERIFIED',
          unit: 'Score 94',
          status: 'optimal',
          regulationOrRef: 'No SAFER/VOIP Risk Flags (P08)',
        },
        {
          label: 'EDI Transmission Health',
          value: 'SYNCED',
          unit: '204/990',
          status: 'optimal',
          regulationOrRef: 'ANSI X12 Control Counts Verified',
        },
      ];
    },
    quickActions: [
      {
        id: 'act-rate-con',
        label: 'Audit Freight Pricing & Surcharge (P02)',
        targetStage: 'freight_pricing',
        description: 'Verify cost waterfall, broker gross margin, and detention rate card terms.',
        iconType: 'dollar',
      },
      {
        id: 'act-trust-shield',
        label: 'Vet Carrier Authority & Insurance (P08)',
        targetStage: 'carrier_trust',
        description: 'Check SAFER authority status, BMC-91X primary liability, and cyber-fraud flags.',
        iconType: 'shield',
      },
    ],
  },
  {
    id: 'Javier Ortiz',
    name: 'Javier Ortiz',
    roleTitle: 'DC Flow Master & Yard Operations Lead',
    badgeCode: 'DC-LEAD',
    organization: 'Midwest Intermountain Cold Distribution Center',
    avatarColor: '#14b8a6', // Teal
    mandate: 'Inbound putaway planning, bay capacity limits, cross-dock flow, drop lot staging, reefer temperature setpoints, gate kiosk check-in, detention mitigation.',
    touchstone: 'GS1 EPCIS 2.0 Inbound Traceability · FSMA Cold-Chain Temperature Records · ISO 17712 High-Security Bolt Seals',
    priorityStages: ['warehouse_space', 'yard_dock', 'fleet_telematics'],
    focalMetrics: (order) => [
      {
        label: 'Inbound Pallet Units',
        value: `${order.packageCount}`,
        unit: 'Pallets',
        status: 'optimal',
        regulationOrRef: `${order.packageName} Assets`,
      },
      {
        label: 'Dock Door Status',
        value: 'DOOR 14',
        unit: 'Allocated',
        status: 'optimal',
        regulationOrRef: 'Automated Kiosk Check-In (P07)',
      },
      {
        label: 'Cold-Chain Setpoint Target',
        value: `${order.reeferSetpointF}°F`,
        unit: 'Setpoint',
        status: order.reeferSetpointF <= 34 ? 'optimal' : 'neutral',
        regulationOrRef: 'FSMA 21 CFR § 1.908 Continuous Log',
      },
      {
        label: 'Detention Urgency Countdown',
        value: '0:48',
        unit: 'hr:min',
        status: 'optimal',
        regulationOrRef: '$85/hr Carrier Fee Trigger at 2.0h',
      },
    ],
    quickActions: [
      {
        id: 'act-warehouse-tsp',
        label: 'Optimize Wave Picking & TSP Path (P06)',
        targetStage: 'warehouse_space',
        description: 'Run TSP 2-Opt heuristic pick path and verify FEFO lot expiration dates.',
        iconType: 'package',
      },
      {
        id: 'act-yard-kiosk',
        label: 'Digital Guard Shack & Gate Pass (P07)',
        targetStage: 'yard_dock',
        description: 'Verify ISO 17712 bolt seals, issue encrypted digital gate pass, and assign dock doors.',
        iconType: 'building',
      },
      {
        id: 'act-reefer-telematics',
        label: 'Monitor Reefer Thermal Sensors (P05)',
        targetStage: 'fleet_telematics',
        description: 'Inspect return-air sensor feeds and send bidirectional remote defrost/temp commands.',
        iconType: 'zap',
      },
    ],
  },
  {
    id: 'PER-RT-0103',
    name: 'Inspector Dale Bradley',
    roleTitle: 'Senior Commercial Vehicle Safety Officer',
    badgeCode: 'DOT-AUDIT',
    organization: 'FMCSA / CVSA Commercial Enforcement',
    avatarColor: '#ef4444', // Red
    mandate: '49 CFR Parts 390–399, CVSA Out-of-Service criteria, ELD compliance, Bridge Formula B, cargo securement WLL, DQF & Clearinghouse audits.',
    touchstone: '49 CFR Part 391 (DQF) · 49 CFR Part 393 (Parts & Securement) · 49 CFR Part 395 (Hours of Service) · 49 CFR Part 382 (Clearinghouse)',
    priorityStages: ['carrier_trust', 'hos_planner', 'cargo_fit'],
    focalMetrics: (order) => [
      {
        label: 'DQF Clearinghouse Query',
        value: 'CLEARED',
        unit: 'Part 382',
        status: 'optimal',
        regulationOrRef: 'Annual Commercial Query Certified',
      },
      {
        label: 'Driver Medical Examiner Reg',
        value: 'ACTIVE',
        unit: 'MCSA-5876',
        status: 'optimal',
        regulationOrRef: 'National NRCME Registry Verified',
      },
      {
        label: '14-Hour Shift Legality',
        value: '100% LEGAL',
        unit: '§ 395.3',
        status: order.transitHoursTotal <= 14 ? 'optimal' : 'warning',
        regulationOrRef: 'No Consecutive Window Violations',
      },
      {
        label: 'Gross Vehicle Weight (GVW)',
        value: `${order.totalPayloadLbs + 32000}`,
        unit: 'lbs',
        status: (order.totalPayloadLbs + 32000) <= 80000 ? 'optimal' : 'warning',
        regulationOrRef: '23 U.S.C. § 127 Bridge Formula B',
      },
    ],
    quickActions: [
      {
        id: 'act-dqf-audit',
        label: 'Audit Driver Qualification File (P08)',
        targetStage: 'carrier_trust',
        description: 'Verify CDL validity, Medical Card, 365-day MVR review, and Clearinghouse query status.',
        iconType: 'shield',
      },
      {
        id: 'act-eld-audit',
        label: 'Inspect 24-Hour ELD Logbook Grid (P03)',
        targetStage: 'hos_planner',
        description: 'Verify statutory split-sleeper pause calculations and adverse driving exemptions.',
        iconType: 'clock',
      },
      {
        id: 'act-securement-audit',
        label: 'Verify Tie-Down WLL & Airbags (P01)',
        targetStage: 'cargo_fit',
        description: 'Audit 49 CFR § 393.106 cargo securement restraint vectors and dunnage voids.',
        iconType: 'package',
      },
    ],
  },
];

export function getPersonaRoleById(id: string): PersonaRoleDefinition {
  const match = PERSONA_ROLES.find((r) => r.id === id);
  return match || PERSONA_ROLES[0];
}

export function filterPriorityStagesForRole(roleId: string): LifecycleStageId[] {
  const role = getPersonaRoleById(roleId);
  return role.priorityStages;
}

export interface PersonaCockpitSwitcherProps {
  activeRoleId: PersonaRoleId;
  onSelectRole: (roleId: PersonaRoleId) => void;
  order: FreightOrderSpec;
  onNavigateStage: (stageId: LifecycleStageId) => void;
}

export const PersonaCockpitSwitcher: React.FC<PersonaCockpitSwitcherProps> = ({
  activeRoleId,
  onSelectRole,
  order,
  onNavigateStage,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const activeRole = getPersonaRoleById(activeRoleId);
  const focalMetrics = activeRole.focalMetrics(order);

  // Render role icon helper
  const renderActionIcon = (type: RoleQuickAction['iconType']) => {
    switch (type) {
      case 'truck':
        return <IconTruck size={14} />;
      case 'dollar':
        return <IconDollar size={14} />;
      case 'clock':
        return <IconClock size={14} />;
      case 'package':
        return <IconPackage size={14} />;
      case 'building':
        return <IconBuilding size={14} />;
      case 'shield':
        return <IconShieldAlert size={14} />;
      case 'zap':
        return <IconZap size={14} />;
      default:
        return <IconClipboard size={14} />;
    }
  };

  return (
    <section
      aria-label="Persona Cockpit View Switcher"
      className="persona-cockpit-container"
      style={{
        background: 'linear-gradient(180deg, #070d1e 0%, #0c1529 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        margin: '10px 16px',
        padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Top Bar: Role Selector Tabs & Expansion Toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          paddingBottom: isExpanded ? '10px' : '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#94a3b8',
              textTransform: 'uppercase',
            }}
          >
            ROLE COCKPIT VIEW:
          </span>
          <div
            role="tablist"
            aria-label="Persona view selection"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {PERSONA_ROLES.map((role) => {
              const isSelected = role.id === activeRole.id;
              return (
                <button
                  key={role.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectRole(role.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    border: isSelected
                      ? `1px solid ${role.avatarColor}`
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    background: isSelected
                      ? `rgba(255, 255, 255, 0.07)`
                      : 'rgba(15, 23, 42, 0.6)',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    transition: 'all 0.15s ease',
                  }}
                  title={`${role.name} · ${role.roleTitle}`}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: role.avatarColor,
                      boxShadow: isSelected ? `0 0 8px ${role.avatarColor}` : 'none',
                    }}
                  />
                  <span>{role.badgeCode}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>({role.name.split(' ')[0]})</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▲ Hide Cockpit HUD' : '▼ Expand Cockpit HUD'}
        </button>
      </div>

      {/* Expanded Role Details & Focal Metrics HUD */}
      {isExpanded && (
        <div style={{ marginTop: '12px' }}>
          {/* Active Persona Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '10px 14px',
              borderRadius: '6px',
              borderLeft: `4px solid ${activeRole.avatarColor}`,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{activeRole.name}</strong>
                <span
                  style={{
                    background: `rgba(255, 255, 255, 0.1)`,
                    color: activeRole.avatarColor,
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                  }}
                >
                  {activeRole.badgeCode}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>— {activeRole.roleTitle}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#cbd5e1' }}>
                <strong>Mandate:</strong> {activeRole.mandate}
              </p>
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                <strong>Statutory Touchstone:</strong> {activeRole.touchstone}
              </div>
            </div>

            {/* Quick Action Buttons for This Role */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activeRole.quickActions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => onNavigateStage(act.targetStage)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '6px 10px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={act.description}
                >
                  {renderActionIcon(act.iconType)}
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 Role-Tailored Focal Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '10px',
              marginTop: '10px',
            }}
          >
            {focalMetrics.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(10, 18, 36, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.label}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      background:
                        m.status === 'optimal'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : m.status === 'warning'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        m.status === 'optimal'
                          ? '#10b981'
                          : m.status === 'warning'
                          ? '#ef4444'
                          : '#f59e0b',
                    }}
                  >
                    {m.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '16px', color: '#f8fafc', fontFamily: 'var(--font-mono, monospace)' }}>
                    {m.value}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{m.unit}</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.regulationOrRef}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
