/**
 * Global Freight Command Center Types & Lifecycle State Machine
 */

export type LifecycleStageId =
  | 'asset_studio'      // Product 04: Port 5176
  | 'cargo_fit'         // Product 01: Port 5173
  | 'freight_pricing'   // Product 02: Port 5174
  | 'hos_planner'       // Product 03: Port 5175
  | 'fleet_telematics'; // Product 05: Port 5177

export interface SubProductMeta {
  id: LifecycleStageId;
  code: string;
  name: string;
  port: number;
  url: string;
  tagline: string;
  icon: string;
  accentColor: string;
}

export const SUB_PRODUCTS: SubProductMeta[] = [
  {
    id: 'asset_studio',
    code: 'P04',
    name: 'Asset Studio',
    port: 5176,
    url: 'http://localhost:5176',
    tagline: 'Digital Twin Catalog & Dynamic CG Simulator',
    icon: '🚛',
    accentColor: '#c084fc',
  },
  {
    id: 'cargo_fit',
    code: 'P01',
    name: 'Cargo Fit',
    port: 5173,
    url: 'http://localhost:5173',
    tagline: '3D Isometric Packing & Bridge Formula Solver',
    icon: '📦',
    accentColor: '#38bdf8',
  },
  {
    id: 'freight_pricing',
    code: 'P02',
    name: 'Freight Pricing HUD',
    port: 5174,
    url: 'http://localhost:5174',
    tagline: 'Carrier Cost Waterfall & EIA Diesel Pegging',
    icon: '💰',
    accentColor: '#10b981',
  },
  {
    id: 'hos_planner',
    code: 'P03',
    name: 'HOS Planner',
    port: 5175,
    url: 'http://localhost:5175',
    tagline: 'FMCSA Part 395 24-Hr ELD Grid & Corridor Planner',
    icon: '⏱️',
    accentColor: '#f59e0b',
  },
  {
    id: 'fleet_telematics',
    code: 'P05',
    name: 'Fleet Telematics',
    port: 5177,
    url: 'http://localhost:5177',
    tagline: 'J1939 CAN Bus Telemetry & Cold-Chain Excursions',
    icon: '📡',
    accentColor: '#f43f5e',
  },
];

export interface FreightOrderSpec {
  orderId: string;
  orderNumber: string;
  customerName: string;
  originCity: string;
  destinationCity: string;
  distanceMiles: number;
  requiredDeliveryDate: string;

  // Selected Equipment (P04)
  vehicleId: string;
  vehicleName: string;
  trailerLengthFt: number;
  maxPayloadLbs: number;

  // Cargo Demand (P01)
  packageId: string;
  packageName: string;
  packageCount: number;
  weightPerUnitLbs: number;
  totalPayloadLbs: number;
  axleDistributionStatus: 'compliant' | 'warning' | 'illegal';

  // Pricing Waterfall (P02)
  ratePerMile: number;
  fuelSurcharge: number;
  accessorialsTotal: number;
  totalCarrierPay: number;

  // HOS Scheduling (P03)
  transitHoursTotal: number;
  driverMode: 'solo' | 'team';
  mandatoryLayoverCount: number;
  hosComplianceStatus: 'legal' | 'violation';

  // Dispatch & Telematics (P05)
  assignedDriverId: string;
  assignedTractorUnit: string;
  bolNumber: string;
  bolSigned: boolean;
  reeferSetpointF: number;
  currentDispatchStatus: 'staged' | 'loading' | 'in_transit' | 'delivered';
}

export interface LifecycleProgressState {
  currentStage: LifecycleStageId;
  completedStages: LifecycleStageId[];
  activeOrder: FreightOrderSpec;
  lastUpdatedEpoch: number;
}
