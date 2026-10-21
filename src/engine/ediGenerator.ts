/**
 * ANSI ASC X12 EDI Transaction Set Generator & Segment Inspector
 * Product Suite: Command Center Portal (Port 5170)
 *
 * Implements:
 * - EDI 204: Motor Carrier Load Tender (Shipper -> Carrier)
 * - EDI 990: Response to a Load Tender (Carrier -> Shipper)
 * - EDI 214: Transportation Carrier Shipment Status Message (Carrier -> Shipper/Broker)
 * - EDI 210: Motor Carrier Freight Details and Invoice (Carrier -> Shipper)
 */

import { FreightOrderSpec } from './types';

export interface EdiSegmentField {
  tag: string;
  name: string;
  value: string;
  description: string;
}

export interface EdiParsedSegment {
  raw: string;
  segmentId: string;
  name: string;
  purpose: string;
  fields: EdiSegmentField[];
}

export interface EdiDocumentBundle {
  docType: '204' | '990' | '214' | '210';
  title: string;
  direction: string;
  standard: string;
  rawX12: string;
  jsonObj: Record<string, unknown>;
  parsedSegments: EdiParsedSegment[];
}

/**
 * Formats a date into YYMMDD or CCYYMMDD.
 */
function formatDate(iso: string, format: 'YYMMDD' | 'CCYYMMDD' = 'YYMMDD'): string {
  const d = new Date(iso);
  const yy = String(d.getUTCFullYear()).slice(-2);
  const ccyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return format === 'CCYYMMDD' ? `${ccyy}${mm}${dd}` : `${yy}${mm}${dd}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}${mm}`;
}

/**
 * Generates an EDI 204 Motor Carrier Load Tender.
 */
export function generateEdi204(order: FreightOrderSpec): EdiDocumentBundle {
  const today = new Date().toISOString();
  const dateYYMMDD = formatDate(today, 'YYMMDD');
  const dateCCYYMMDD = formatDate(today, 'CCYYMMDD');
  const timeHHMM = formatTime(today);
  const delivDate = formatDate(order.requiredDeliveryDate, 'CCYYMMDD');

  const segments: string[] = [
    `ISA*00*          *00*          *ZZ*${order.customerName.slice(0, 15).padEnd(15)}*ZZ*CARRIEREXP     *${dateYYMMDD}*${timeHHMM}*U*00401*000000001*0*P*>~`,
    `GS*TM*${order.customerName.slice(0, 10).trim()}*CARRIEREXP*${dateCCYYMMDD}*${timeHHMM}*1*X*004010~`,
    `ST*204*0001~`,
    `B2**${order.orderNumber}**PP~`,
    `B2A*00*LT~`,
    `L11*${order.orderId}*OQ~`,
    `L11*${order.bolNumber}*BM~`,
    `G62*10*${delivDate}*U*1800~`,
    `MS3*CARRIEREXP*B**R~`,
    `N1*SH*${order.customerName}~`,
    `N3*100 Logistics Boulevard~`,
    `N4*${order.originCity.split(',')[0]}*${order.originCity.split(',')[1]?.trim() || 'IL'}*60601*US~`,
    `N1*CN*Consignee Receiving Docks~`,
    `N3*450 Distribution Way~`,
    `N4*${order.destinationCity.split(',')[0]}*${order.destinationCity.split(',')[1]?.trim() || 'NY'}*10001*US~`,
    `S5*1*LD*${order.totalPayloadLbs}*LB*${order.packageCount}*PLT~`,
    `OID*${order.orderNumber}*${order.packageCount}*PLT*${order.totalPayloadLbs}*LB~`,
    `L5*1*${order.packageName}*T*G~`,
    `SE*17*0001~`,
    `GE*1*1~`,
    `IEA*1*000000001~`,
  ];

  const rawX12 = segments.join('\n');

  const parsedSegments: EdiParsedSegment[] = [
    {
      raw: segments[2],
      segmentId: 'ST',
      name: 'Transaction Set Header',
      purpose: 'Identifies the transaction set as an EDI 204 Motor Carrier Load Tender.',
      fields: [
        { tag: 'ST01', name: 'Transaction Set Identifier Code', value: '204', description: 'Motor Carrier Load Tender' },
        { tag: 'ST02', name: 'Control Number', value: '0001', description: 'Unique transaction control number' },
      ],
    },
    {
      raw: segments[3],
      segmentId: 'B2',
      name: 'Beginning Segment for Motor Carrier',
      purpose: 'Transmits basic shipment identifiers and payment method.',
      fields: [
        { tag: 'B202', name: 'Shipment Identification Number', value: order.orderNumber, description: 'Master Bill of Lading reference' },
        { tag: 'B204', name: 'Payment Method Code', value: 'PP', description: 'Prepaid freight charges' },
      ],
    },
    {
      raw: segments[4],
      segmentId: 'B2A',
      name: 'Set Purpose',
      purpose: 'Indicates the operational intent of the load tender.',
      fields: [
        { tag: 'B2A01', name: 'Transaction Set Purpose Code', value: '00', description: 'Original load offer' },
        { tag: 'B2A02', name: 'Application Type', value: 'LT', description: 'Load Tender' },
      ],
    },
    {
      raw: segments[7],
      segmentId: 'G62',
      name: 'Date/Time Reference',
      purpose: 'Specifies the scheduled arrival window and required delivery appointment.',
      fields: [
        { tag: 'G6201', name: 'Date Qualifier', value: '10', description: 'Requested Ship/Delivery Date' },
        { tag: 'G6202', name: 'Date', value: delivDate, description: 'Delivery appointment date (YYYYMMDD)' },
        { tag: 'G6204', name: 'Time', value: '1800', description: 'Target appointment time' },
      ],
    },
    {
      raw: segments[15],
      segmentId: 'S5',
      name: 'Stop-Off Details',
      purpose: 'Defines origin loading stop sequence, weight, and equipment units.',
      fields: [
        { tag: 'S501', name: 'Stop Sequence Number', value: '1', description: 'Primary Shipper Origin' },
        { tag: 'S502', name: 'Stop Reason Code', value: 'LD', description: 'Live Loading' },
        { tag: 'S503', name: 'Weight', value: String(order.totalPayloadLbs), description: 'Certified payload weight' },
        { tag: 'S504', name: 'Weight Unit', value: 'LB', description: 'Pounds' },
        { tag: 'S505', name: 'Quantity', value: String(order.packageCount), description: 'Units/Pallets' },
        { tag: 'S506', name: 'Packaging Code', value: 'PLT', description: 'Palletized Freight' },
      ],
    },
  ];

  return {
    docType: '204',
    title: 'EDI 204 — Motor Carrier Load Tender',
    direction: 'Inbound (Shipper → Motor Carrier)',
    standard: 'ANSI ASC X12 Release 004010',
    rawX12,
    jsonObj: {
      transactionSet: '204',
      orderNumber: order.orderNumber,
      orderId: order.orderId,
      customer: order.customerName,
      origin: order.originCity,
      destination: order.destinationCity,
      deliveryTarget: order.requiredDeliveryDate,
      equipment: order.vehicleName,
      payloadLbs: order.totalPayloadLbs,
      units: order.packageCount,
      rateOffered: order.totalCarrierPay,
    },
    parsedSegments,
  };
}

/**
 * Generates an EDI 990 Response to a Load Tender.
 */
export function generateEdi990(order: FreightOrderSpec, accepted: boolean = true): EdiDocumentBundle {
  const today = new Date().toISOString();
  const dateYYMMDD = formatDate(today, 'YYMMDD');
  const dateCCYYMMDD = formatDate(today, 'CCYYMMDD');
  const timeHHMM = formatTime(today);

  const segments: string[] = [
    `ISA*00*          *00*          *ZZ*CARRIEREXP     *ZZ*${order.customerName.slice(0, 15).padEnd(15)}*${dateYYMMDD}*${timeHHMM}*U*00401*000000002*0*P*>~`,
    `GS*GF*CARRIEREXP*${order.customerName.slice(0, 10).trim()}*${dateCCYYMMDD}*${timeHHMM}*2*X*004010~`,
    `ST*990*0001~`,
    `B1*CARRIEREXP*${order.orderNumber}*${dateCCYYMMDD}*${accepted ? 'A' : 'D'}~`,
    `N9*OQ*${order.orderId}~`,
    `V9*${order.assignedTractorUnit}*${order.vehicleName.slice(0, 20)}~`,
    `K1*ACCEPTED UNDER RATE CONFIRMATION $${order.totalCarrierPay.toFixed(2)}~`,
    `SE*6*0001~`,
    `GE*1*2~`,
    `IEA*1*000000002~`,
  ];

  return {
    docType: '990',
    title: 'EDI 990 — Response to Load Tender',
    direction: 'Outbound (Motor Carrier → Shipper)',
    standard: 'ANSI ASC X12 Release 004010',
    rawX12: segments.join('\n'),
    jsonObj: {
      transactionSet: '990',
      orderNumber: order.orderNumber,
      decision: accepted ? 'ACCEPTED' : 'DECLINED',
      carrierCode: 'CARRIEREXP',
      rateConfirmed: order.totalCarrierPay,
      assignedTractor: order.assignedTractorUnit,
    },
    parsedSegments: [
      {
        raw: segments[3],
        segmentId: 'B1',
        name: 'Beginning Segment for Booking or Pick-up/Delivery',
        purpose: 'Transmits carrier tender acceptance or decline.',
        fields: [
          { tag: 'B101', name: 'Standard Carrier Alpha Code (SCAC)', value: 'CARRIEREXP', description: 'Carrier identifier' },
          { tag: 'B102', name: 'Shipment Identification Number', value: order.orderNumber, description: 'Shipper load reference' },
          { tag: 'B104', name: 'Action Code', value: accepted ? 'A' : 'D', description: accepted ? 'A - Tender Accepted' : 'D - Tender Declined' },
        ],
      },
    ],
  };
}

/**
 * Generates an EDI 214 Shipment Status Message.
 */
export function generateEdi214(order: FreightOrderSpec): EdiDocumentBundle {
  const today = new Date().toISOString();
  const dateYYMMDD = formatDate(today, 'YYMMDD');
  const dateCCYYMMDD = formatDate(today, 'CCYYMMDD');
  const timeHHMM = formatTime(today);

  const segments: string[] = [
    `ISA*00*          *00*          *ZZ*CARRIEREXP     *ZZ*${order.customerName.slice(0, 15).padEnd(15)}*${dateYYMMDD}*${timeHHMM}*U*00401*000000003*0*P*>~`,
    `GS*QM*CARRIEREXP*${order.customerName.slice(0, 10).trim()}*${dateCCYYMMDD}*${timeHHMM}*3*X*004010~`,
    `ST*214*0001~`,
    `B10*${order.orderNumber}*${order.bolNumber}*CARRIEREXP~`,
    `L11*${order.orderId}*OQ~`,
    `N1*CN*Consignee Receiving Docks~`,
    `LX*1~`,
    `AT7*X6*NS***${dateCCYYMMDD}*${timeHHMM}*ET~`,
    `MS1*Chicago*IL*US~`,
    `MS2*CARRIEREXP*104~`,
    `SE*9*0001~`,
    `GE*1*3~`,
    `IEA*1*000000003~`,
  ];

  return {
    docType: '214',
    title: 'EDI 214 — Shipment Status Tracking Message',
    direction: 'Outbound (Motor Carrier → Broker / Shipper)',
    standard: 'ANSI ASC X12 Release 004010',
    rawX12: segments.join('\n'),
    jsonObj: {
      transactionSet: '214',
      orderNumber: order.orderNumber,
      bol: order.bolNumber,
      status: 'En Route to Delivery Location',
      statusCode: 'X6',
      currentLocation: 'Chicago, IL',
      tractorUnit: order.assignedTractorUnit,
      reeferStatus: `${order.reeferSetpointF}°F Nominal`,
    },
    parsedSegments: [
      {
        raw: segments[7],
        segmentId: 'AT7',
        name: 'Shipment Status Details',
        purpose: 'Provides live operational milestone code and time stamp.',
        fields: [
          { tag: 'AT701', name: 'Shipment Status Code', value: 'X6', description: 'En Route to Delivery Location' },
          { tag: 'AT702', name: 'Shipment Status Reason Code', value: 'NS', description: 'Normal Transit (On Schedule)' },
          { tag: 'AT705', name: 'Event Date', value: dateCCYYMMDD, description: 'GPS Timestamp Date' },
          { tag: 'AT706', name: 'Event Time', value: timeHHMM, description: 'GPS Timestamp Time' },
        ],
      },
    ],
  };
}

/**
 * Generates an EDI 210 Motor Carrier Freight Invoice.
 */
export function generateEdi210(order: FreightOrderSpec): EdiDocumentBundle {
  const today = new Date().toISOString();
  const dateYYMMDD = formatDate(today, 'YYMMDD');
  const dateCCYYMMDD = formatDate(today, 'CCYYMMDD');
  const timeHHMM = formatTime(today);

  const segments: string[] = [
    `ISA*00*          *00*          *ZZ*CARRIEREXP     *ZZ*${order.customerName.slice(0, 15).padEnd(15)}*${dateYYMMDD}*${timeHHMM}*U*00401*000000004*0*P*>~`,
    `GS*IM*CARRIEREXP*${order.customerName.slice(0, 10).trim()}*${dateCCYYMMDD}*${timeHHMM}*4*X*004010~`,
    `ST*210*0001~`,
    `B3*B*INV-${order.orderNumber}*${order.orderNumber}*PP*${dateCCYYMMDD}*${order.totalCarrierPay.toFixed(2)}*${dateCCYYMMDD}*CARRIEREXP~`,
    `N1*BT*${order.customerName}~`,
    `N3*Accounts Payable Suite 400~`,
    `N4*${order.originCity.split(',')[0]}*${order.originCity.split(',')[1]?.trim() || 'IL'}*60601*US~`,
    `LX*1~`,
    `L1*1*${(order.ratePerMile * order.distanceMiles).toFixed(2)}*FR*${(order.ratePerMile * order.distanceMiles).toFixed(2)}~`,
    `LX*2~`,
    `L1*2*${order.fuelSurcharge.toFixed(2)}*FUE*${order.fuelSurcharge.toFixed(2)}~`,
    `LX*3~`,
    `L1*3*${order.accessorialsTotal.toFixed(2)}*REE*${order.accessorialsTotal.toFixed(2)}~`,
    `L3*${order.totalPayloadLbs}*G*${order.totalCarrierPay.toFixed(2)}*****${order.packageCount}*PLT~`,
    `SE*14*0001~`,
    `GE*1*4~`,
    `IEA*1*000000004~`,
  ];

  return {
    docType: '210',
    title: 'EDI 210 — Motor Carrier Freight Details & Invoice',
    direction: 'Outbound (Motor Carrier → Shipper AP)',
    standard: 'ANSI ASC X12 Release 004010',
    rawX12: segments.join('\n'),
    jsonObj: {
      transactionSet: '210',
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      billTo: order.customerName,
      linehaulAmount: order.ratePerMile * order.distanceMiles,
      fuelSurchargeAmount: order.fuelSurcharge,
      accessorialAmount: order.accessorialsTotal,
      totalInvoiceDue: order.totalCarrierPay,
    },
    parsedSegments: [
      {
        raw: segments[3],
        segmentId: 'B3',
        name: 'Beginning Segment for Carriers Invoice',
        purpose: 'Transmits invoice number, billing date, and net amount due.',
        fields: [
          { tag: 'B302', name: 'Invoice Number', value: `INV-${order.orderNumber}`, description: 'Carrier invoice identifier' },
          { tag: 'B303', name: 'Shipment Number', value: order.orderNumber, description: 'Matched BOL load number' },
          { tag: 'B307', name: 'Net Amount Due', value: `$${order.totalCarrierPay.toFixed(2)}`, description: 'Total carrier payout' },
        ],
      },
    ],
  };
}
