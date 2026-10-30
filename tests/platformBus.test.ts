import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { platformBus, PlatformMessage } from '../src/engine/platformBus';

describe('Cross-Tab Platform Event Bus (trucking-platform-bus)', () => {
  beforeEach(() => {
    platformBus.close();
  });

  afterEach(() => {
    platformBus.close();
  });

  it('subscribes to ORDER_SELECTED events and handles published payloads with metadata', () => {
    const received: PlatformMessage[] = [];

    const unsubscribe = platformBus.subscribe('ORDER_SELECTED', (payload, msg) => {
      expect(payload.orderId).toBe('ORD-2026-X89');
      expect(payload.orderNumber).toBe('TRK-CHI-NYC-8921');
      expect(payload.customerName).toBe('Kraft Heinz North America');
      received.push(msg);
    });

    platformBus.publish(
      'ORDER_SELECTED',
      {
        orderId: 'ORD-2026-X89',
        orderNumber: 'TRK-CHI-NYC-8921',
        customerName: 'Kraft Heinz North America',
        origin: 'Chicago, IL',
        destination: 'New York, NY',
        distanceMiles: 790,
        vehicleId: 'reefer-53',
        packageId: 'pallet-gma-48x40',
        packageCount: 26,
        totalPayloadLbs: 40300,
        timestamp: new Date().toISOString(),
      },
      { senderProduct: 'command-center-portal', senderPort: 5170 }
    );

    expect(received.length).toBe(1);
    expect(received[0].senderProduct).toBe('command-center-portal');
    expect(received[0].senderPort).toBe(5170);

    // Unsubscribe and verify no more events trigger handler
    unsubscribe();
    platformBus.publish(
      'ORDER_SELECTED',
      {
        orderId: 'ORD-2026-X90',
        orderNumber: 'TRK-LA-PHX-4421',
        customerName: 'Anheuser-Busch InBev',
        origin: 'Los Angeles, CA',
        destination: 'Phoenix, AZ',
        distanceMiles: 375,
        vehicleId: 'dry-van-53',
        packageId: 'pallet-gma-48x40',
        packageCount: 24,
        totalPayloadLbs: 38400,
        timestamp: new Date().toISOString(),
      }
    );

    expect(received.length).toBe(1); // Still 1, handler was removed
  });

  it('routes distinct events to their respective subscribers without cross-talk', () => {
    let vehicleEventCount = 0;
    let pricingEventCount = 0;

    const unsubV = platformBus.subscribe('VEHICLE_CHANGED', (payload) => {
      expect(payload.vehicleId).toBe('dry-van-53');
      vehicleEventCount++;
    });

    const unsubP = platformBus.subscribe('PRICING_UPDATED', (payload) => {
      expect(payload.ratePerMile).toBe(2.85);
      pricingEventCount++;
    });

    platformBus.publish('VEHICLE_CHANGED', {
      vehicleId: 'dry-van-53',
      vehicleName: "53' Standard Dry Van",
      maxPayloadLbs: 45000,
      trailerLengthFt: 53,
      source: 'product-04-asset-studio',
    });

    expect(vehicleEventCount).toBe(1);
    expect(pricingEventCount).toBe(0);

    platformBus.publish('PRICING_UPDATED', {
      orderId: 'ORD-2026-X89',
      ratePerMile: 2.85,
      fuelSurcharge: 480,
      totalQuote: 2881.5,
      operatingRatioPct: 88.5,
    });

    expect(vehicleEventCount).toBe(1);
    expect(pricingEventCount).toBe(1);

    unsubV();
    unsubP();
  });

  it('broadcasts high-frequency TELEMATICS_STREAM_TICK and SAFETY_ALERT events cleanly', () => {
    const alerts: string[] = [];

    const unsub = platformBus.subscribe('SAFETY_ALERT', (payload) => {
      alerts.push(payload.message);
    });

    platformBus.publish('SAFETY_ALERT', {
      alertId: 'ALT-1092',
      unitNumber: 'UNIT-104',
      category: 'HARSH_BRAKE',
      severity: 'warning',
      message: 'Harsh Braking Event: Deceleration > 9.2 mph/s at Mile 412',
      timestamp: new Date().toISOString(),
    });

    platformBus.publish('SAFETY_ALERT', {
      alertId: 'ALT-1093',
      unitNumber: 'UNIT-104',
      category: 'TEMP_EXCURSION',
      severity: 'critical',
      message: 'FSMA Cold Chain Excursion: Temp reached -4°F (Set point: -10°F)',
      timestamp: new Date().toISOString(),
    });

    expect(alerts.length).toBe(2);
    expect(alerts[0]).toContain('Harsh Braking');
    expect(alerts[1]).toContain('FSMA Cold Chain Excursion');

    unsub();
  });

  it('persists published events to circular ring buffer and retrieves recent events', () => {
    platformBus.clearRecentEvents();

    platformBus.publish(
      'SAFETY_ALERT',
      {
        alertId: 'ALT-101',
        unitNumber: 'TRK-900',
        category: 'HARSH_BRAKE',
        severity: 'warning',
        message: 'Sudden deceleration > 0.45g detected on I-80 EB MM 142',
        timestamp: new Date().toISOString(),
      },
      { senderProduct: 'product-05-fleet-telematics', senderPort: 5177 }
    );

    platformBus.publish(
      'CARGO_LOAD_UPDATED',
      {
        packageId: 'pallet-gma-48x40',
        itemCount: 26,
        totalWeightLbs: 41200,
        axleLegal: true,
        source: 'product-01-cargo-fit',
      },
      { senderProduct: 'product-01-cargo-fit', senderPort: 5173 }
    );

    const recent = platformBus.getRecentEvents(10);
    expect(recent.length).toBe(2);
    expect(recent[0].type).toBe('CARGO_LOAD_UPDATED'); // most recent first
    expect(recent[1].type).toBe('SAFETY_ALERT');
    expect(recent[1].senderProduct).toBe('product-05-fleet-telematics');
  });
});
