/**
 * Global Freight Command Center Types & Lifecycle State Machine
 */

export type LifecycleStageId =
  | 'asset_studio'      // Product 04: Port 5176
  | 'cargo_fit'         // Product 01: Port 5173
  | 'warehouse_space'   // Product 06: Port 5178
  | 'carrier_trust'     // Product 08: Port 5180
  | 'freight_pricing'   // Product 02: Port 5174
  | 'hos_planner'       // Product 03: Port 5175
  | 'fleet_telematics'  // Product 05: Port 5177
  | 'yard_dock';        // Product 07: Port 5179

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

export const CLOUD_URLS: Record<LifecycleStageId, string> = {
  asset_studio: 'https://fleetstudio.pages.dev',
  cargo_fit: 'https://cargofit.pages.dev',
  warehouse_space: 'https://warehouseflow.pages.dev',
  carrier_trust: 'https://carriertrust.pages.dev',
  freight_pricing: 'https://freightpricing.pages.dev',
  hos_planner: 'https://hosdispatch.pages.dev',
  fleet_telematics: 'https://fleettelematics.pages.dev',
  yard_dock: 'https://yarddock.pages.dev',
};

export const SUB_PRODUCTS: SubProductMeta[] = [
  {
    id: 'asset_studio',
    code: 'P04',
    name: 'Asset Studio',
    port: 5176,
    url: 'http://localhost:5176',
    tagline: '3D Teardown Lab, Digital Twin Catalog & Dynamic CG Simulator',
    icon: 'P04',
    accentColor: '#c084fc',
  },
  {
    id: 'cargo_fit',
    code: 'P01',
    name: 'Cargo Fit',
    port: 5173,
    url: 'http://localhost:5173',
    tagline: '3D Isometric Packing & Bridge Formula Solver',
    icon: 'P01',
    accentColor: '#38bdf8',
  },
  {
    id: 'warehouse_space',
    code: 'P06',
    name: 'Warehouse Space & Flow',
    port: 5178,
    url: 'http://localhost:5178',
    tagline: 'Multi-Constraint Inbound Space Planner & GS1 EPCIS Digital Twin',
    icon: 'P07',
    accentColor: '#06b6d4',
  },
  {
    id: 'carrier_trust',
    code: 'P08',
    name: 'Carrier Safety & Trust',
    port: 5180,
    url: 'http://localhost:5180',
    tagline: 'FMCSA SMS BASIC Scores & Anti-Double-Brokering Shield',
    icon: 'P06',
    accentColor: '#10b981',
  },
  {
    id: 'freight_pricing',
    code: 'P02',
    name: 'Freight Pricing HUD',
    port: 5174,
    url: 'http://localhost:5174',
    tagline: 'Carrier Cost Waterfall & EIA Diesel Pegging',
    icon: 'P02',
    accentColor: '#10b981',
  },
  {
    id: 'hos_planner',
    code: 'P03',
    name: 'HOS Planner',
    port: 5175,
    url: 'http://localhost:5175',
    tagline: 'FMCSA Part 395 24-Hr ELD Grid & Corridor Planner',
    icon: 'P03',
    accentColor: '#f59e0b',
  },
  {
    id: 'fleet_telematics',
    code: 'P05',
    name: 'Fleet Telematics',
    port: 5177,
    url: 'http://localhost:5177',
    tagline: 'J1939 CAN Bus Telemetry & Cold-Chain Excursions',
    icon: 'P05',
    accentColor: '#f43f5e',
  },
  {
    id: 'yard_dock',
    code: 'P07',
    name: 'Yard & Dock',
    port: 5179,
    url: 'http://localhost:5179',
    tagline: 'Carrier Appointments, Gate OCR Kiosk & Detention Radar',
    icon: 'P08',
    accentColor: '#f59e0b',
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
