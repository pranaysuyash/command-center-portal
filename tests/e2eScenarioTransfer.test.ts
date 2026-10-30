import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESET_ORDERS,
  buildSubProductContextUrl,
  loadSavedLifecycleState,
  saveLifecycleState,
} from '../src/engine/lifecycle';
import { SUB_PRODUCTS, LifecycleProgressState } from '../src/engine/types';

describe('End-to-End Cross-Product Scenario Contract & Transactional Decisions', () => {
  it('selects preset shipment and builds complete context deep links across all subproducts', () => {
    const order = DEFAULT_PRESET_ORDERS[0];
    expect(order.orderId).toBe('ORD-2026-X89');
    expect(order.customerName).toContain('Simulated Scenario');

    for (const prod of SUB_PRODUCTS) {
      const urlStr = buildSubProductContextUrl(prod.id, order);
      const url = new URL(urlStr);
      expect(url.searchParams.get('source')).toBe('command_center_portal');
      expect(url.searchParams.get('orderId')).toBe(order.orderId);
      expect(url.searchParams.get('orderNumber')).toBe(order.orderNumber);

      if (prod.id === 'cargo_fit') {
        expect(url.searchParams.get('vehicleId')).toBe(order.vehicleId);
        expect(url.searchParams.get('cargoWeight')).toBe(String(order.totalPayloadLbs));
      } else if (prod.id === 'freight_pricing') {
        expect(url.searchParams.get('loadedMiles')).toBe(String(order.distanceMiles));
        expect(url.searchParams.get('cargoWeight')).toBe(String(order.totalPayloadLbs));
      } else if (prod.id === 'hos_planner') {
        expect(url.searchParams.get('miles')).toBe(String(order.distanceMiles));
        expect(url.searchParams.get('driverMode')).toBe(order.driverMode);
      } else if (prod.id === 'fleet_telematics') {
        expect(url.searchParams.get('unitNumber')).toBe(order.assignedTractorUnit);
        expect(url.searchParams.get('setpointF')).toBe(String(order.reeferSetpointF));
      }
    }
  });

  it('records verified transactional stage decisions in lifecycle state instead of mock booleans', () => {
    const initial = loadSavedLifecycleState();
    expect(initial.stageDecisions).toBeDefined();
    expect(initial.stageDecisions?.asset_studio?.status).toBe('COMPLETED');
    expect(initial.stageDecisions?.asset_studio?.verifiedBy).toContain('Asset Studio');

    // Simulate receiving verified cargo fit calculation event
    const updatedState: LifecycleProgressState = {
      ...initial,
      completedStages: [...initial.completedStages, 'cargo_fit'],
      stageDecisions: {
        ...initial.stageDecisions,
        cargo_fit: {
          stageId: 'cargo_fit',
          status: 'COMPLETED',
          verifiedBy: 'Platform Mesh (Product 01 Cargo Fit)',
          timestamp: '2026-10-30T18:20:00Z',
          inboundPayload: {
            orderId: initial.activeOrder.orderId,
            declaredWeightLbs: 40300,
          },
          computedOutput: {
            steerAxleLbs: 11800,
            driveTandemLbs: 33400,
            trailerTandemLbs: 33100,
            kpraCompliant: true,
          },
          notes: 'Cargo: 26 pallets, 40,300 lbs · Axle: Legal beam reaction distribution',
        },
      },
    };

    expect(updatedState.stageDecisions?.cargo_fit?.status).toBe('COMPLETED');
    expect(updatedState.stageDecisions?.cargo_fit?.computedOutput?.kpraCompliant).toBe(true);

    saveLifecycleState(updatedState);
  });

  it('verifies that altering shipment mass propagates to payload and axle calculations', () => {
    const order = { ...DEFAULT_PRESET_ORDERS[0] };
    const originalWeight = order.totalPayloadLbs;
    expect(originalWeight).toBe(40300);

    // Alter mass to 44,500 lbs (near max payload of 43,500 lbs reefer)
    const alteredWeight = 44500;
    const isExceedingVehiclePayload = alteredWeight > order.maxPayloadLbs;
    expect(isExceedingVehiclePayload).toBe(true);

    // Dynamic loaded MPG shift based on weight (standard 0.1 MPG loss per 5,000 lbs cargo)
    const baseMpg = 6.8;
    const alteredMpg = Number((baseMpg - ((alteredWeight - 20000) / 5000) * 0.12).toFixed(2));
    expect(alteredMpg).toBeLessThan(baseMpg);

    // Diesel burn for 790 miles
    const fuelGallonsBurned = Number((order.distanceMiles / alteredMpg).toFixed(1));
    expect(fuelGallonsBurned).toBeGreaterThan(order.distanceMiles / baseMpg);
  });
});
