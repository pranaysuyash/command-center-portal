import { describe, it, expect } from 'vitest';
import {
  PERSONA_ROLES,
  getPersonaRoleById,
  filterPriorityStagesForRole,
  PersonaRoleId,
} from '../src/ui/PersonaCockpitSwitcher';
import { DEFAULT_PRESET_ORDERS } from '../src/engine/lifecycle';
import { SUB_PRODUCTS } from '../src/engine/types';

describe('Role-Based Persona Cockpit Switcher (T-029)', () => {
  const sampleOrder = DEFAULT_PRESET_ORDERS[0];
  const allSubproductStageIds = SUB_PRODUCTS.map((p) => p.id);

  it('registers all 5 canonical industry personas with complete metadata', () => {
    expect(PERSONA_ROLES.length).toBe(5);

    const ids = PERSONA_ROLES.map((r) => r.id);
    expect(ids).toContain('PER-950374');  // Fleet Operations Manager (Marcus Vance)
    expect(ids).toContain('PER-RT-0101'); // Independent Owner-Operator (Hank Reynolds)
    expect(ids).toContain('PER-RT-0104'); // Commercial 3PL Freight Broker
    expect(ids).toContain('Javier Ortiz');// Warehouse & Yard Flow Lead
    expect(ids).toContain('PER-RT-0103'); // FMCSA / CVSA Regulatory Safety Auditor (Dale Bradley)

    for (const role of PERSONA_ROLES) {
      expect(role.name).toBeTruthy();
      expect(role.roleTitle).toBeTruthy();
      expect(role.badgeCode).toBeTruthy();
      expect(role.organization).toBeTruthy();
      expect(role.avatarColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(role.mandate.length).toBeGreaterThan(20);
      expect(role.touchstone.length).toBeGreaterThan(15);
      expect(role.priorityStages.length).toBeGreaterThan(0);
      expect(role.quickActions.length).toBeGreaterThan(0);
    }
  });

  it('retrieves persona roles by ID or safely falls back to default', () => {
    const marcus = getPersonaRoleById('PER-950374');
    expect(marcus.name).toBe('Marcus Vance');
    expect(marcus.badgeCode).toBe('OPS-DIR');

    const hank = getPersonaRoleById('PER-RT-0101');
    expect(hank.name).toBe('Hank Reynolds');
    expect(hank.badgeCode).toBe('OWNER-OP');

    const javier = getPersonaRoleById('Javier Ortiz');
    expect(javier.name).toBe('Javier Ortiz');
    expect(javier.badgeCode).toBe('DC-LEAD');

    // Unknown ID fallback
    const fallback = getPersonaRoleById('UNKNOWN_ID' as PersonaRoleId);
    expect(fallback.id).toBe('PER-950374');
  });

  it('maps priority stages correctly for each persona', () => {
    const marcusStages = filterPriorityStagesForRole('PER-950374');
    expect(marcusStages).toContain('asset_studio');
    expect(marcusStages).toContain('yard_dock');

    const hankStages = filterPriorityStagesForRole('PER-RT-0101');
    expect(hankStages).toContain('cargo_fit');
    expect(hankStages).toContain('freight_pricing');
    expect(hankStages).toContain('hos_planner');

    const daleStages = filterPriorityStagesForRole('PER-RT-0103');
    expect(daleStages).toContain('carrier_trust');
    expect(daleStages).toContain('hos_planner');
    expect(daleStages).toContain('cargo_fit');
  });

  it('ensures all quick actions route to valid subproduct lifecycle stages', () => {
    for (const role of PERSONA_ROLES) {
      for (const act of role.quickActions) {
        expect(act.id).toBeTruthy();
        expect(act.label).toBeTruthy();
        expect(act.description).toBeTruthy();
        expect(allSubproductStageIds).toContain(act.targetStage);
      }
    }
  });

  it('evaluates tailored focal metrics for all 5 roles without NaN or missing values', () => {
    for (const role of PERSONA_ROLES) {
      const metrics = role.focalMetrics(sampleOrder);
      expect(metrics.length).toBe(4);

      for (const m of metrics) {
        expect(m.label).toBeTruthy();
        expect(m.value).toBeTruthy();
        expect(m.value).not.toBe('NaN');
        expect(m.value).not.toBe('undefined');
        expect(m.unit).toBeTruthy();
        expect(['optimal', 'warning', 'neutral']).toContain(m.status);
        expect(m.regulationOrRef).toBeTruthy();
      }
    }
  });

  it('computes expected values for specific persona roles', () => {
    // Test Broker 3PL margin calculations
    const broker = getPersonaRoleById('PER-RT-0104');
    const brokerMetrics = broker.focalMetrics(sampleOrder);
    const marginMetric = brokerMetrics.find((m) => m.label === 'Brokerage Gross Margin');
    expect(marginMetric).toBeDefined();
    expect(marginMetric!.unit).toMatch(/^\$/);
    expect(marginMetric!.value).toMatch(/%$/);

    // Test Safety Auditor gross vehicle weight calculation
    const auditor = getPersonaRoleById('PER-RT-0103');
    const auditorMetrics = auditor.focalMetrics(sampleOrder);
    const gvwMetric = auditorMetrics.find((m) => m.label.includes('Gross Vehicle Weight'));
    expect(gvwMetric).toBeDefined();
    const gvwValue = parseInt(gvwMetric!.value, 10);
    expect(gvwValue).toBe(sampleOrder.totalPayloadLbs + 32000);
    expect(gvwMetric!.regulationOrRef).toContain('Bridge Formula B');
  });
});
