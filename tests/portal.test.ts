import { describe, it, expect } from 'vitest';
import {
  SUB_PRODUCTS,
  LifecycleStageId,
} from '../src/engine/types';
import {
  DEFAULT_PRESET_ORDERS,
  buildSubProductContextUrl,
  loadSavedLifecycleState,
} from '../src/engine/lifecycle';

describe('Global Command Center Portal Architecture', () => {
  it('registers all 5 commercial freight products with distinct ports', () => {
    expect(SUB_PRODUCTS.length).toBe(5);

    const ports = SUB_PRODUCTS.map((p) => p.port);
    expect(ports).toContain(5173); // P01: Cargo Fit
    expect(ports).toContain(5174); // P02: Freight Pricing
    expect(ports).toContain(5175); // P03: HOS Planner
    expect(ports).toContain(5176); // P04: Asset Studio
    expect(ports).toContain(5177); // P05: Fleet Telematics

    // Verify all ports are unique
    expect(new Set(ports).size).toBe(5);
  });

  it('contains valid default freight order presets with full lifecycle parameters', () => {
    expect(DEFAULT_PRESET_ORDERS.length).toBeGreaterThanOrEqual(2);

    for (const order of DEFAULT_PRESET_ORDERS) {
      expect(order.orderId).toBeTruthy();
      expect(order.orderNumber).toBeTruthy();
      expect(order.distanceMiles).toBeGreaterThan(0);
      expect(order.vehicleId).toBeTruthy();
      expect(order.totalPayloadLbs).toBeGreaterThan(0);
      expect(order.totalCarrierPay).toBeGreaterThan(0);
      expect(order.bolNumber).toBeTruthy();
    }
  });

  it('generates context-rich bridge URLs for all 5 subproducts from the active order', () => {
    const order = DEFAULT_PRESET_ORDERS[0];
    const stages: LifecycleStageId[] = [
      'asset_studio',
      'cargo_fit',
      'freight_pricing',
      'hos_planner',
      'fleet_telematics',
    ];

    for (const stage of stages) {
      const url = buildSubProductContextUrl(stage, order);
      expect(url).toContain('http://localhost:517');
      expect(url).toContain('source=command_center_portal');
      expect(url).toContain(`orderId=${order.orderId}`);
    }

    // Stage specific parameters
    const p04Url = buildSubProductContextUrl('asset_studio', order);
    expect(p04Url).toContain(`vehicle=${order.vehicleId}`);

    const p01Url = buildSubProductContextUrl('cargo_fit', order);
    expect(p01Url).toContain(`cargoWeight=${order.totalPayloadLbs}`);

    const p02Url = buildSubProductContextUrl('freight_pricing', order);
    expect(p02Url).toContain(`loadedMiles=${order.distanceMiles}`);

    const p03Url = buildSubProductContextUrl('hos_planner', order);
    expect(p03Url).toContain(`driverMode=${order.driverMode}`);

    const p05Url = buildSubProductContextUrl('fleet_telematics', order);
    expect(p05Url).toContain(`bol=${order.bolNumber}`);
  });

  it('initializes default lifecycle state safely when running outside browser DOM', () => {
    const state = loadSavedLifecycleState();
    expect(state.currentStage).toBe('asset_studio');
    expect(state.completedStages).toContain('asset_studio');
    expect(state.activeOrder.orderId).toBe(DEFAULT_PRESET_ORDERS[0].orderId);
  });
});
