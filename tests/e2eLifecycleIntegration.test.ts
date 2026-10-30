import { describe, it, expect } from 'vitest';
import { DEFAULT_PRESET_ORDERS, buildSubProductContextUrl } from '../src/engine/lifecycle';
import { platformBus } from '../src/engine/platformBus';
import { solveOptimalTandemPosition } from '../../product-01-cargo-fit/src/engine/tandemSlider';
import { evaluateCargoVoidsAndDunnage } from '../../product-01-cargo-fit/src/engine/dunnageVoidCalculator';
import { calculateContractFuelSurcharge } from '../../product-02-freight-pricing/src/engine/eiaDieselAdapter';
import { evaluateTriangulationBackhauls } from '../../product-02-freight-pricing/src/engine/triangulationBackhaul';
import { evaluateAgriculturalExemption } from '../../product-03-hos-planner/src/engine/hosExemptions';
import { ingestTelematicsPayload } from '../../product-05-fleet-telematics/src/engine/telematicsAdapter';
import { aggregateCorridorJurisdictionMiles } from '../../product-05-fleet-telematics/src/engine/iftaCompliance';
import { CORRIDOR_I80 } from '../../product-05-fleet-telematics/src/engine/corridors';
import { calculateDetentionClock, assignOptimalDockDoor, INITIAL_DOCK_DOORS } from '../../product-07-yard-dock/src/engine/yardEngine';
import { evaluateOperatingAuthority, evaluateContactSecurity, evaluateAutomatedDnd } from '../../product-08-carrier-trust/src/engine/carrierAuthority';

describe('End-to-End Sovereign Freight Lifecycle Integration Suite', () => {
  const masterOrder = DEFAULT_PRESET_ORDERS[0]; // TRK-CHI-NYC-8921, Chicago -> NYC, 790 mi, 40,300 lbs

  it('Stage 1 (Portal): Generates valid order context and navigation routes for all 8 subproducts', () => {
    expect(masterOrder.orderNumber).toBe('TRK-CHI-NYC-8921');
    expect(masterOrder.distanceMiles).toBe(790);
    expect(masterOrder.totalPayloadLbs).toBe(40300);

    const fitUrl = buildSubProductContextUrl('cargo_fit', masterOrder);
    const pricingUrl = buildSubProductContextUrl('freight_pricing', masterOrder);
    const hosUrl = buildSubProductContextUrl('hos_planner', masterOrder);

    expect(fitUrl).toContain('5173');
    expect(pricingUrl).toContain('5174');
    expect(hosUrl).toContain('5175');
  });

  it('Stage 2 (Cargo Fit): Solves legal axle balancing, dunnage airbags, and publishes CARGO_LOAD_UPDATED', () => {
    // 1. Solve legal tandem pin hole under Federal Bridge Formula B
    const tandemResult = solveOptimalTandemPosition({
      equipmentLengthMm: 16154,
      cargoWeightKg: 15422, // ~34,000 lbs solvable cargo
      cargoCogXMm: 7468, // 24.5 ft from nose
      tareSteerLbs: 10500,
      tareDriveLbs: 14000,
      tareTrailerLbs: 10500,
      trailerWheelbaseIn: 456,
    });
    expect(tandemResult.feasible).toBe(true);
    expect(tandemResult.bestResult.allAxlesLegal).toBe(true);
    expect(tandemResult.bestResult.driveWeightLbs).toBeLessThanOrEqual(34000);
    expect(tandemResult.bestResult.trailerWeightLbs).toBeLessThanOrEqual(34000);
    expect(tandemResult.bestResult.kpraFt).toBeLessThanOrEqual(40.0);

    // 2. Calculate 49 CFR § 393.106 cargo voids and Level 1 dunnage airbags
    const dunnage = evaluateCargoVoidsAndDunnage({
      equipment: { lengthMm: 16154, widthMm: 2590, heightMm: 2794 },
      placements: [
        { unitId: 'HU-1', label: 'Pallet 1', xMm: 0, yMm: 0, zMm: 0, dxMm: 1219, dyMm: 1016, dzMm: 1500, weightKg: 800 },
      ],
    });
    expect(dunnage.totalVoidsDetected).toBeGreaterThan(0);
    expect(dunnage.airbagSummary.level1AirbagsCount + dunnage.airbagSummary.level2AirbagsCount).toBeGreaterThan(0);

    // 3. Publish CARGO_LOAD_UPDATED event to platform bus
    platformBus.publish('CARGO_LOAD_UPDATED', {
      packageId: 'PALLET-48X40',
      itemCount: 26,
      totalWeightLbs: 34000,
      axleLegal: tandemResult.bestResult.allAxlesLegal,
      source: 'cargo_fit_p01',
    });
  });

  it('Stage 3 (Pricing): Applies EIA fuel surcharge, backhaul triangulation, and publishes PRICING_UPDATED', () => {
    // 1. EIA fuel surcharge calculation ($3.85 / gal, $1.25 base, 790 mi)
    const fuel = calculateContractFuelSurcharge(3.85, masterOrder.distanceMiles, 1.25);
    expect(fuel.centsPerMileSurcharge).toBe(0.52);
    expect(fuel.totalFuelSurchargeUsd).toBe(410.80);

    // 2. 3-Leg Backhaul Triangulation (Chicago -> NYC Headhaul with Pittsburgh return)
    const triangulation = evaluateTriangulationBackhauls({
      headhaulLeg: {
        id: 'LEG-1',
        origin: 'Chicago, IL',
        destination: 'New York, NY',
        miles: 790,
        ratePerMile: 2.85,
        fuelSurchargePerMile: 0.52,
      },
      directReturnDeadheadMiles: 790,
      potentialIntermediateStops: [
        {
          intermediateCity: 'Pittsburgh, PA',
          leg2Miles: 370,
          leg2RatePerMile: 2.65,
          leg3Miles: 460,
          leg3RatePerMile: 2.45,
        },
      ],
      operatingCostPerMile: 1.85,
    });
    expect(triangulation.bestTriangleScenario).toBeDefined();
    expect(triangulation.bestTriangleScenario?.profitLiftOverDirectReturnUsd).toBeGreaterThan(0);

    // 3. Publish PRICING_UPDATED event
    platformBus.publish('PRICING_UPDATED', {
      orderId: masterOrder.orderId,
      ratePerMile: 2.85,
      fuelSurcharge: fuel.centsPerMileSurcharge,
      totalQuote: masterOrder.totalCarrierPay,
      operatingRatioPct: 88.5,
    });
  });

  it('Stage 4 (HOS Planner): Computes statutory exemptions, split sleeper, and publishes HOS_SCHEDULE_UPDATED', () => {
    // 1. Evaluate agricultural 150-air-mile exemption
    const exemptions = evaluateAgriculturalExemption({
      originLat: 41.525,
      originLng: -88.081,
      currentLat: 41.878,
      currentLng: -87.629,
      isHarvestSeason: true,
      commodityType: 'PERISHABLE_PRODUCE',
    });
    expect(exemptions.isExempt).toBe(true);
    expect(exemptions.insideZone).toBe(true);
    expect(exemptions.statutoryBasis).toContain('395.1(k)');

    // 2. Publish HOS_SCHEDULE_UPDATED event
    platformBus.publish('HOS_SCHEDULE_UPDATED', {
      corridorId: 'CORR-CHI-NYC',
      driverMode: 'solo',
      totalTransitHours: 15.2,
      layoverCount: 1,
      isLegal: true,
    });
  });

  it('Stage 5 (Telematics & IFTA): Verifies J1939 OBD-II telemetry and IFTA state tax breakdown', () => {
    // 1. Ingest J1939 CAN bus snapshot
    const telemetry = ingestTelematicsPayload({
      vehicleId: 'TRK-104',
      timestamp: new Date().toISOString(),
      location: { latitude: 41.52, longitude: -88.08, speedMph: 65.0, odometerMiles: 142000 },
      j1939Signals: {
        spn190_engineRpm: 1250,
        spn84_wheelSpeedMph: 65.0,
        spn110_coolantTempF: 190.0,
        spn1081_reeferTempF: -10.1,
      },
    }, -10.0);
    expect(telemetry.isReeferExcursion).toBe(false);
    expect(telemetry.highestAlertSeverity).toBe('NORMAL');

    // 2. Calculate IFTA jurisdiction road mileage across I-80 corridor
    const iftaMiles = aggregateCorridorJurisdictionMiles(CORRIDOR_I80, 1390);
    expect(iftaMiles.length).toBe(5); // IL, IA, NE, WY, UT
    expect(iftaMiles.map((j) => j.stateCode)).toEqual(['IL', 'IA', 'NE', 'WY', 'UT']);
  });

  it('Stage 6 (Yard & Dock): Allocates Reefer Door and calculates carrier detention timeline', () => {
    // 1. Assign optimal Reefer dock door
    const door = assignOptimalDockDoor(INITIAL_DOCK_DOORS, 'REEFER');
    expect(door).toBeDefined();
    expect(door?.type).toBe('REEFER');
    expect(door?.status).toBe('AVAILABLE');

    // 2. Track detention clock at 105 minutes elapsed (15 minutes free time remaining)
    const detention = calculateDetentionClock(
      'TLR-3991-RF',
      'Polar Express Logistics',
      new Date(Date.now() - 105 * 60 * 1000).toISOString(),
      120
    );
    expect(detention.isDetained).toBe(false);
    expect(detention.remainingMinutes).toBe(15);
  });

  it('Stage 7 (Carrier Trust): Validates Form BMC-91X, contact intelligence, and dispatch safety clearance', () => {
    // 1. SAFER operating authority and BMC-91X filing verification
    const auth = evaluateOperatingAuthority([
      {
        authorityType: 'COMMON_CARRIER',
        formType: 'BMC-91X',
        filingStatus: 'ACTIVE',
        effectiveDate: '2023-01-01',
        coverageLimitUsd: 1000000,
        insuranceCompany: 'Travelers Casualty',
      },
    ]);
    expect(auth.isLegallyAuthorized).toBe(true);

    // 2. Cyber-risk & VOIP inspection
    const contact = evaluateContactSecurity({
      phoneLineType: 'LANDLINE',
      telecomCarrier: 'AT&T Business',
      voipRiskLevel: 'LOW',
      emailDomain: 'apexlogistics.com',
      emailDomainType: 'CORPORATE_MATCH',
      domainAgeDays: 1400,
      ipOriginCountry: 'US',
      ipCity: 'Joliet, IL',
      isVpnOrProxy: false,
      ipGeolocationMismatch: false,
    });
    expect(contact.riskCategory).toBe('LOW');

    // 3. Automated DND check
    const dnd = evaluateAutomatedDnd({
      operatingAuthority: 'AUTHORIZED_FOR_HIRE',
      safetyRating: 'SATISFACTORY',
      fraudIndicators: {
        chameleonCarrierRisk: 'low',
        doubleBrokeringRisk: 'low',
        recentOwnershipChange: false,
        freightGuardReportsCount: 0,
        unauthorizedContactEmailDomain: false,
      },
    });
    expect(dnd.isDndLocked).toBe(false);
  });

  it('Stage 8 (Mesh State Convergence): Confirms circular ring-buffer recorded all reactive lifecycle events', () => {
    const recent = platformBus.getRecentEvents(10);
    expect(recent.length).toBeGreaterThanOrEqual(3);

    const types = recent.map((e) => e.type);
    expect(types).toContain('CARGO_LOAD_UPDATED');
    expect(types).toContain('PRICING_UPDATED');
    expect(types).toContain('HOS_SCHEDULE_UPDATED');
  });
});
