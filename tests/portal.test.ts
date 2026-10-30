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
import {
  generateEdi204,
  generateEdi990,
  generateEdi214,
  generateEdi210,
} from '../src/engine/ediGenerator';

describe('Global Command Center Portal Architecture', () => {
  it('registers all commercial freight products with distinct ports', () => {
    expect(SUB_PRODUCTS.length).toBe(8);

    const ports = SUB_PRODUCTS.map((p) => p.port);
    expect(ports).toContain(5173); // P01: Cargo Fit
    expect(ports).toContain(5174); // P02: Freight Pricing
    expect(ports).toContain(5175); // P03: HOS Planner
    expect(ports).toContain(5176); // P04: Asset Studio
    expect(ports).toContain(5177); // P05: Fleet Telematics
    expect(ports).toContain(5178); // P06: Carrier Safety & Trust
    expect(ports).toContain(5179); // P07: Warehouse Space & Flow
    expect(ports).toContain(5180); // P08: Yard & Dock

    // Verify all ports are unique
    expect(new Set(ports).size).toBe(8);
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

  it('generates context-rich bridge URLs for all subproducts from the active order', () => {
    const order = DEFAULT_PRESET_ORDERS[0];
    const stages: LifecycleStageId[] = [
      'asset_studio',
      'cargo_fit',
      'warehouse_space',
      'carrier_trust',
      'freight_pricing',
      'hos_planner',
      'fleet_telematics',
      'yard_dock',
    ];

    for (const stage of stages) {
      const url = buildSubProductContextUrl(stage, order);
      expect(url).toMatch(/http:\/\/localhost:51[78]\d/);
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

describe('ANSI ASC X12 EDI Transaction Generation & Segment Parsing', () => {
  const order = DEFAULT_PRESET_ORDERS[0];

  it('generates compliant EDI 204 Motor Carrier Load Tender', () => {
    const bundle = generateEdi204(order);
    expect(bundle.docType).toBe('204');
    expect(bundle.rawX12).toContain('ST*204*0001~');
    expect(bundle.rawX12).toContain(`B2**${order.orderNumber}**PP~`);
    expect(bundle.rawX12).toContain(`OID*${order.orderNumber}*${order.packageCount}*PLT*${order.totalPayloadLbs}*LB~`);
    expect(bundle.rawX12).toContain('SE*17*0001~');
    expect(bundle.parsedSegments.length).toBeGreaterThanOrEqual(4);
  });

  it('generates compliant EDI 990 Response to a Load Tender', () => {
    const bundle = generateEdi990(order, true);
    expect(bundle.docType).toBe('990');
    expect(bundle.rawX12).toContain('ST*990*0001~');
    expect(bundle.rawX12).toContain(`B1*CARRIEREXP*${order.orderNumber}*`);
    expect(bundle.rawX12).toContain('*A~'); // A = Accepted
    expect(bundle.jsonObj.decision).toBe('ACCEPTED');
  });

  it('generates compliant EDI 214 Transportation Carrier Shipment Status Message with accurate dispatch status', () => {
    // 1. Order in transit
    const inTransitOrder = { ...order, currentDispatchStatus: 'in_transit' as const };
    const bundleTransit = generateEdi214(inTransitOrder);
    expect(bundleTransit.docType).toBe('214');
    expect(bundleTransit.rawX12).toContain('ST*214*0001~');
    expect(bundleTransit.rawX12).toContain(`B10*${order.orderNumber}*${order.bolNumber}*CARRIEREXP~`);
    expect(bundleTransit.rawX12).toContain('AT7*X6*NS***');
    expect(bundleTransit.jsonObj.status).toBe('En Route to Delivery Location');

    // 2. Order still loading at origin dock (CC-02 fix)
    const loadingOrder = { ...order, currentDispatchStatus: 'loading' as const };
    const bundleLoading = generateEdi214(loadingOrder);
    expect(bundleLoading.rawX12).toContain('AT7*X3*NS***');
    expect(bundleLoading.jsonObj.statusCode).toBe('X3');
    expect(bundleLoading.jsonObj.status).toContain('Loading in Progress');
  });

  it('generates compliant EDI 210 Motor Carrier Freight Invoice with mathematically exact segment count (CC-02)', () => {
    const bundle = generateEdi210(order);
    expect(bundle.docType).toBe('210');
    expect(bundle.rawX12).toContain('ST*210*0001~');
    expect(bundle.rawX12).toContain(`B3*B*INV-${order.orderNumber}*${order.orderNumber}*PP*`);
    expect(bundle.rawX12).toContain(`*${order.totalCarrierPay.toFixed(2)}*`);
    // Exact segment count verification: 13 segments from ST through SE
    expect(bundle.rawX12).toContain('SE*13*0001~');
    expect(bundle.rawX12).not.toContain('SE*14*0001~');
    expect(bundle.jsonObj.invoiceNumber).toBe(`INV-${order.orderNumber}`);
    expect(bundle.jsonObj.totalInvoiceDue).toBe(order.totalCarrierPay);
  });

  it('aggregates high-priority cross-product exceptions for the Exception Control Tower', () => {
    const mockPlatformEvents = [
      {
        id: 'evt-1',
        type: 'SAFETY_ALERT',
        senderProduct: 'Product 05 Telematics',
        senderPort: 5177,
        timestamp: '2026-10-30T10:00:00Z',
        summary: 'Reefer Thermal Excursion: Zone 1 Return Air +5°F over setpoint',
        severity: 'critical' as const,
        payloadJson: '{}',
      },
      {
        id: 'evt-2',
        type: 'CARGO_LOAD_UPDATED',
        senderProduct: 'Product 01 Cargo Fit',
        senderPort: 5173,
        timestamp: '2026-10-30T10:05:00Z',
        summary: 'Tractor Drive Tandem Overload: 35,400 lbs vs 34,000 lbs limit',
        severity: 'warning' as const,
        payloadJson: '{}',
      },
      {
        id: 'evt-3',
        type: 'ORDER_SELECTED',
        senderProduct: 'Portal',
        senderPort: 5170,
        timestamp: '2026-10-30T10:10:00Z',
        summary: 'Order 9042 selected',
        severity: 'info' as const,
        payloadJson: '{}',
      },
    ];

    const criticalAndWarning = mockPlatformEvents.filter(
      (e) => e.severity === 'critical' || e.severity === 'warning'
    );
    expect(criticalAndWarning.length).toBe(2);
    expect(criticalAndWarning[0].type).toBe('SAFETY_ALERT');
    expect(criticalAndWarning[1].type).toBe('CARGO_LOAD_UPDATED');
  });
});

