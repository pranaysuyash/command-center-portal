/**
 * Global Freight Command Center Lifecycle Engine & Stage Dispatcher
 */

import {
  LifecycleStageId,
  FreightOrderSpec,
  LifecycleProgressState,
  SUB_PRODUCTS,
  CLOUD_URLS,
} from './types';

export const DEFAULT_PRESET_ORDERS: FreightOrderSpec[] = [
  {
    orderId: 'ORD-2026-X89',
    orderNumber: 'TRK-CHI-NYC-8921',
    customerName: 'Kraft Heinz North America',
    originCity: 'Chicago, IL',
    destinationCity: 'New York, NY',
    distanceMiles: 790,
    requiredDeliveryDate: '2026-10-23T18:00:00Z',

    vehicleId: 'reefer-53',
    vehicleName: "53' Temperature-Controlled Reefer",
    trailerLengthFt: 53,
    maxPayloadLbs: 43500,

    packageId: 'pallet-gma-48x40',
    packageName: 'Standard GMA 48×40 Pallet',
    packageCount: 26,
    weightPerUnitLbs: 1550,
    totalPayloadLbs: 40300,
    axleDistributionStatus: 'compliant',

    ratePerMile: 2.85,
    fuelSurcharge: 480,
    accessorialsTotal: 150, // Reefer pre-cool + detention insurance
    totalCarrierPay: 2881.5,

    transitHoursTotal: 15.2,
    driverMode: 'solo',
    mandatoryLayoverCount: 1, // 10h sleeper berth required
    hosComplianceStatus: 'legal',

    assignedDriverId: 'DRV-4091 (Marcus Vance)',
    assignedTractorUnit: 'UNIT-104 (Kenworth T680)',
    bolNumber: 'VICS-BOL-77391-CHI',
    bolSigned: true,
    reeferSetpointF: -10,
    currentDispatchStatus: 'in_transit',
  },
  {
    orderId: 'ORD-2026-M44',
    orderNumber: 'TRK-ATL-DFW-4402',
    customerName: 'Home Depot Supply Chain',
    originCity: 'Atlanta, GA',
    destinationCity: 'Dallas, TX',
    distanceMiles: 780,
    requiredDeliveryDate: '2026-10-24T12:00:00Z',

    vehicleId: 'dry-van-53',
    vehicleName: "53' Standard Dry Van (Class 8)",
    trailerLengthFt: 53,
    maxPayloadLbs: 45000,

    packageId: 'pallet-gma-48x40',
    packageName: 'Standard GMA 48×40 Pallet',
    packageCount: 28,
    weightPerUnitLbs: 1400,
    totalPayloadLbs: 39200,
    axleDistributionStatus: 'compliant',

    ratePerMile: 2.45,
    fuelSurcharge: 425,
    accessorialsTotal: 75,
    totalCarrierPay: 2411.0,

    transitHoursTotal: 14.8,
    driverMode: 'solo',
    mandatoryLayoverCount: 1,
    hosComplianceStatus: 'legal',

    assignedDriverId: 'DRV-2210 (Elena Rostova)',
    assignedTractorUnit: 'UNIT-101 (Freightliner Cascadia)',
    bolNumber: 'VICS-BOL-88419-ATL',
    bolSigned: true,
    reeferSetpointF: 65,
    currentDispatchStatus: 'loading',
  },
];

/**
 * Builds the contextual deep-link URL for an active order into any subproduct.
 */
export function buildSubProductContextUrl(
  stageId: LifecycleStageId,
  order: FreightOrderSpec
): string {
  const baseProduct = SUB_PRODUCTS.find((p) => p.id === stageId);
  if (!baseProduct) return 'http://localhost:5170';

  const isCloud = typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('trucking.io'));
  const baseUrl = isCloud ? (CLOUD_URLS[stageId] || baseProduct.url) : baseProduct.url;

  const params = new URLSearchParams();
  params.set('source', 'command_center_portal');
  params.set('orderId', order.orderId);
  params.set('orderNumber', order.orderNumber);

  switch (stageId) {
    case 'warehouse_space':
      params.set('dockDoor', 'D-02');
      params.set('velocity', 'A');
      params.set('manifestCount', String(order.packageCount));
      break;

    case 'yard_dock':
      params.set('commodity', order.vehicleId.includes('reefer') ? 'REEFER' : 'DRY_VAN');
      params.set('pallets', String(order.packageCount));
      params.set('carrierDot', '3194012');
      break;

    case 'carrier_trust':
      params.set('carrierDot', '3194012');
      params.set('carrierName', 'Polar Express Logistics LLC');
      params.set('action', 'pre_dispatch_audit');
      break;

    case 'asset_studio':
      params.set('vehicle', order.vehicleId);
      params.set('package', order.packageId);
      params.set('quantity', String(order.packageCount));
      break;

    case 'cargo_fit':
      params.set('vehicleId', order.vehicleId);
      params.set('eqName', order.vehicleName);
      params.set('lengthFt', String(order.trailerLengthFt));
      params.set('maxWeightLbs', String(order.maxPayloadLbs));
      params.set('packageQty', String(order.packageCount));
      params.set('cargoWeight', String(order.totalPayloadLbs));
      break;

    case 'freight_pricing':
      params.set('equipment', order.vehicleId.includes('reefer') ? 'reefer' : 'dry_van');
      params.set('loadedMiles', String(order.distanceMiles));
      params.set('cargoWeight', String(order.totalPayloadLbs));
      break;

    case 'hos_planner':
      params.set('miles', String(order.distanceMiles));
      params.set('speedMph', '65');
      params.set('driverMode', order.driverMode);
      params.set('driverId', order.assignedDriverId);
      break;

    case 'fleet_telematics':
      params.set('unitNumber', order.assignedTractorUnit);
      params.set('driverId', order.assignedDriverId);
      params.set('bol', order.bolNumber);
      params.set('setpointF', String(order.reeferSetpointF));
      break;
  }

  return `${baseUrl}/?${params.toString()}`;
}

const STORAGE_KEY = 'trucking_portal_lifecycle_v1';

export function loadSavedLifecycleState(): LifecycleProgressState {
  if (typeof window === 'undefined') {
    return {
      currentStage: 'asset_studio',
      completedStages: ['asset_studio'],
      activeOrder: DEFAULT_PRESET_ORDERS[0],
      lastUpdatedEpoch: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load saved portal state:', err);
  }

  return {
    currentStage: 'asset_studio',
    completedStages: ['asset_studio'],
    activeOrder: DEFAULT_PRESET_ORDERS[0],
    lastUpdatedEpoch: Date.now(),
  };
}

export function saveLifecycleState(state: LifecycleProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save portal state:', err);
  }
}
