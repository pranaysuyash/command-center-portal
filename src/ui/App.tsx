import { useState, useEffect } from 'react';
import {
  LifecycleStageId,
  SUB_PRODUCTS,
  FreightOrderSpec,
} from '../engine/types';
import {
  DEFAULT_PRESET_ORDERS,
  buildSubProductContextUrl,
  loadSavedLifecycleState,
  saveLifecycleState,
} from '../engine/lifecycle';
import { platformBus } from '../engine/platformBus';
import { SuiteDock } from './SuiteDock';
import {
  IconTruck,
  IconCheck,
  IconClipboard,
  IconPackage,
  IconDollar,
  IconClock,
  IconRadio,
  IconZap,
  IconFileText,
  IconDownload,
  IconPrinter,
  IconExternalLink,
  ProductIcon,
} from './icons';
import { EdiHubModal } from './EdiHubModal';
import { DispatchManifestModal } from './DispatchManifestModal';
import { TelemetryTicker } from './TelemetryTicker';
import { PlatformEventStreamModal, RecordedPlatformEvent } from './PlatformEventStreamModal';

export function App() {
  const [initialState] = useState(() => loadSavedLifecycleState());
  const [currentStage, setCurrentStage] = useState<LifecycleStageId>(initialState.currentStage);
  const [completedStages, setCompletedStages] = useState<LifecycleStageId[]>(initialState.completedStages);
  const [activeOrder, setActiveOrder] = useState<FreightOrderSpec>(initialState.activeOrder);
  const [isEdiModalOpen, setIsEdiModalOpen] = useState<boolean>(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState<boolean>(false);
  const [isEventStreamModalOpen, setIsEventStreamModalOpen] = useState<boolean>(false);
  const [isAutoPilot, setIsAutoPilot] = useState<boolean>(false);
  const [platformEvents, setPlatformEvents] = useState<RecordedPlatformEvent[]>([]);

  // Subscribe to cross-tab Platform Mesh events
  useEffect(() => {
    // Load persisted recent events from ring buffer on mount
    try {
      const recent = platformBus.getRecentEvents(30);
      if (recent.length > 0) {
        const initialRecorded: RecordedPlatformEvent[] = recent.map((msg, idx) => ({
          id: `init-${idx}-${msg.timestamp}`,
          type: msg.type,
          senderProduct: msg.senderProduct,
          senderPort: msg.senderPort,
          timestamp: msg.timestamp,
          summary: `${msg.type} from ${msg.senderProduct}`,
          severity: msg.type === 'SAFETY_ALERT' ? 'warning' : 'info',
          payloadJson: JSON.stringify(msg.payload, null, 2),
        }));
        setPlatformEvents(initialRecorded);
      }
    } catch {}

    const handleEvent = (type: any, payload: any, msg: any) => {
      let summary = '';
      let severity: 'critical' | 'warning' | 'info' = 'info';

      if (type === 'SAFETY_ALERT') {
        summary = `${payload.category}: ${payload.message}`;
        severity = payload.severity === 'critical' ? 'critical' : payload.severity === 'warning' ? 'warning' : 'info';
      } else if (type === 'PRICING_UPDATED') {
        summary = `Quote: $${payload.totalQuote?.toLocaleString()} ($${payload.ratePerMile}/mi) · OR: ${payload.operatingRatioPct}%`;
        severity = payload.operatingRatioPct > 98 ? 'warning' : 'info';
        // Auto-advance pricing stage in lifecycle stepper
        setCompletedStages((prev) => (prev.includes('freight_pricing') ? prev : [...prev, 'freight_pricing']));
      } else if (type === 'HOS_SCHEDULE_UPDATED') {
        summary = `Corridor: ${payload.totalTransitHours} hrs (${payload.driverMode}) · ${payload.isLegal ? '✓ Legal' : '⚠ Violation'}`;
        severity = payload.isLegal ? 'info' : 'critical';
        // Auto-advance HOS stage in lifecycle stepper
        setCompletedStages((prev) => (prev.includes('hos_planner') ? prev : [...prev, 'hos_planner']));
      } else if (type === 'CARGO_LOAD_UPDATED') {
        summary = `Cargo: ${payload.itemCount} items, ${payload.totalWeightLbs?.toLocaleString()} lbs · Axle: ${payload.axleLegal ? 'Legal' : 'Overload'}`;
        severity = payload.axleLegal ? 'info' : 'warning';
        // Auto-advance cargo fit stage in lifecycle stepper
        setCompletedStages((prev) => (prev.includes('cargo_fit') ? prev : [...prev, 'cargo_fit']));
      } else if (type === 'ORDER_SELECTED') {
        summary = `Order ${payload.orderNumber}: ${payload.origin} → ${payload.destination} (${payload.distanceMiles} mi)`;
        setCompletedStages((prev) => (prev.includes('asset_studio') ? prev : [...prev, 'asset_studio']));
      } else if (type === 'TELEMATICS_STREAM_TICK') {
        summary = `Unit ${payload.vehicleUnitNumber}: ${payload.speedMph} mph · ${payload.nearestCity} · Fuel ${payload.fuelLevelPct}%`;
        setCompletedStages((prev) => (prev.includes('fleet_telematics') ? prev : [...prev, 'fleet_telematics']));
      } else {
        summary = JSON.stringify(payload);
      }

      const recorded: RecordedPlatformEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        senderProduct: msg?.senderProduct || 'mesh',
        senderPort: msg?.senderPort,
        timestamp: msg?.timestamp || new Date().toISOString(),
        summary,
        severity,
        payloadJson: JSON.stringify(payload, null, 2),
      };

      setPlatformEvents((prev) => [recorded, ...prev.slice(0, 49)]);
    };

    const types = ['SAFETY_ALERT', 'PRICING_UPDATED', 'HOS_SCHEDULE_UPDATED', 'CARGO_LOAD_UPDATED', 'ORDER_SELECTED', 'VEHICLE_CHANGED', 'TELEMATICS_STREAM_TICK'] as const;
    const unsubs = types.map((t) => platformBus.subscribe(t, (payload, msg) => handleEvent(t, payload, msg)));
    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Auto-Pilot continuous lifecycle runner
  useEffect(() => {
    if (!isAutoPilot) return;

    const timer = setInterval(() => {
      const stageIds = SUB_PRODUCTS.map((p) => p.id);
      setCurrentStage((prev) => {
        const idx = stageIds.indexOf(prev);
        setCompletedStages((c) => (c.includes(prev) ? c : [...c, prev]));
        if (idx < stageIds.length - 1) {
          return stageIds[idx + 1];
        } else {
          setIsAutoPilot(false);
          return stageIds[0];
        }
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [isAutoPilot]);

  // Sync state to local storage
  useEffect(() => {
    saveLifecycleState({
      currentStage,
      completedStages,
      activeOrder,
      lastUpdatedEpoch: Date.now(),
    });
  }, [currentStage, completedStages, activeOrder]);

  const activeSubProduct = SUB_PRODUCTS.find((p) => p.id === currentStage) || SUB_PRODUCTS[0];
  const iframeUrl = buildSubProductContextUrl(currentStage, activeOrder);

  const handleSelectStage = (stageId: LifecycleStageId) => {
    setCurrentStage(stageId);
  };

  const handleAdvanceStage = () => {
    const stageIds = SUB_PRODUCTS.map((p) => p.id);
    const currentIndex = stageIds.indexOf(currentStage);

    if (!completedStages.includes(currentStage)) {
      setCompletedStages([...completedStages, currentStage]);
    }

    if (currentIndex < stageIds.length - 1) {
      setCurrentStage(stageIds[currentIndex + 1]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const found = DEFAULT_PRESET_ORDERS.find((o) => o.orderId === orderId);
    if (found) {
      setActiveOrder(found);
      platformBus.publish(
        'ORDER_SELECTED',
        {
          orderId: found.orderId,
          orderNumber: found.orderNumber,
          customerName: found.customerName,
          origin: found.originCity,
          destination: found.destinationCity,
          distanceMiles: found.distanceMiles,
          vehicleId: found.vehicleId,
          packageId: found.packageId,
          packageCount: found.packageCount,
          totalPayloadLbs: found.totalPayloadLbs,
          timestamp: new Date().toISOString(),
        },
        { senderProduct: 'command-center-portal', senderPort: 5170 }
      );
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeOrder, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${activeOrder.orderNumber}-master-manifest.json`);
    dlAnchor.click();
  };



  return (
    <div className="portal-root">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <SuiteDock currentProductId="command-center-portal" />
      {/* Master Command Bar Header */}
      <header className="portal-header">
        <div className="header-brand">
          <div className="brand-shield"><IconTruck size={22} /></div>
          <div className="brand-text">
            <h1>TRUCKING COMMAND CENTER</h1>
            <span>STANDALONE PRESET DEMONSTRATION · PORT 5170</span>
          </div>
        </div>

        {/* Live Subproduct Heartbeat Monitors */}
        <nav aria-label="Subproduct ports" className="fleet-heartbeats-row">
          {SUB_PRODUCTS.map((prod) => (
            <a
              key={prod.id}
              href={prod.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`heartbeat-pill ${currentStage === prod.id ? 'active' : ''}`}
              title={`${prod.name} (${prod.tagline})`}
            >
              <span className="status-dot" />
              <span>{prod.code}: {prod.port}</span>
            </a>
          ))}
        </nav>

        {/* Master Order Preset Selector */}
        <div className="order-selector-box">
          <label htmlFor="portal-active-load-select" style={{ fontSize: '11px', color: '#94a3b8' }}>ACTIVE LOAD:</label>
          <select
            id="portal-active-load-select"
            value={activeOrder.orderId}
            onChange={(e) => handleSelectOrder(e.target.value)}
          >
            {DEFAULT_PRESET_ORDERS.map((o) => (
              <option key={o.orderId} value={o.orderId}>
                {o.orderNumber} ({o.originCity} → {o.destinationCity})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Live Fleet Telemetry & Platform Mesh Stream */}
      <TelemetryTicker
        liveEvents={platformEvents}
        onOpenEventStream={() => setIsEventStreamModalOpen(true)}
      />

      {/* Global 5-Stage Stepper Ribbon */}
      <nav aria-label="Freight lifecycle stages" className="lifecycle-ribbon">
        {SUB_PRODUCTS.map((prod, idx) => {
          const isCurrent = currentStage === prod.id;
          const isCompleted = completedStages.includes(prod.id);

          return (
            <button
              key={prod.id}
              onClick={() => handleSelectStage(prod.id)}
              className={`step-card-btn ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon-bubble">
                <ProductIcon
                  productId={
                    prod.id === 'warehouse_space'
                      ? 'product-06-warehouse-space-flow'
                      : prod.id === 'asset_studio'
                      ? 'product-04-asset-studio'
                      : prod.id === 'cargo_fit'
                      ? 'product-01-cargo-fit'
                      : prod.id === 'freight_pricing'
                      ? 'product-02-freight-pricing'
                      : prod.id === 'hos_planner'
                      ? 'product-03-hos-planner'
                      : 'product-05-fleet-telematics'
                  }
                  size={20}
                />
              </div>
              <div className="step-info-col">
                <div className="step-code-row">
                  <span>STAGE 0{idx + 1} · {prod.code}</span>
                  {isCompleted && (
                    <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconCheck size={12} /> VIEWED
                    </span>
                  )}
                </div>
                <div className="step-name">{prod.name}</div>
                <div className="step-tagline">{prod.tagline}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Split Layout */}
      <div className="portal-main-layout">
        {/* Left Sidebar: Master Freight Dossier */}
        <aside className="order-dossier-panel" aria-label="Master Freight Dossier">
          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconClipboard size={14} /> Order Overview</span>
              <span style={{ color: '#38bdf8' }}>{activeOrder.orderNumber}</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Shipper:</span>
              <span className="d-val">{activeOrder.customerName}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Route Corridor:</span>
              <span className="d-val">{activeOrder.originCity} → {activeOrder.destinationCity}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Corridor Distance:</span>
              <span className="d-val">{activeOrder.distanceMiles} mi</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Delivery Target:</span>
              <span className="d-val">{activeOrder.requiredDeliveryDate.slice(0, 10)}</span>
            </div>
          </div>

          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconTruck size={14} /> P04 Equipment Spec</span>
              <span className="compliance-badge compliant">ACTIVE</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Vehicle Twin:</span>
              <span className="d-val">{activeOrder.vehicleName}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Trailer Length:</span>
              <span className="d-val">{activeOrder.trailerLengthFt} ft</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Max Payload Cap:</span>
              <span className="d-val">{activeOrder.maxPayloadLbs.toLocaleString()} lbs</span>
            </div>
          </div>

          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconPackage size={14} /> P01 Cargo & Axle Fit</span>
              <span className="compliance-badge compliant">LEGAL GVW</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Packaging Asset:</span>
              <span className="d-val">{activeOrder.packageName}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Units Loaded:</span>
              <span className="d-val">{activeOrder.packageCount} pallets</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Total Cargo Payload:</span>
              <span className="d-val">{activeOrder.totalPayloadLbs.toLocaleString()} lbs</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Axle Weight Distribution:</span>
              <span className="d-val" style={{ color: '#10b981' }}>Bridge Law Legal</span>
            </div>
          </div>

          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconDollar size={14} /> P02 Freight Pricing</span>
              <span style={{ color: '#10b981' }}>${activeOrder.totalCarrierPay.toLocaleString()}</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Linehaul Rate:</span>
              <span className="d-val">${activeOrder.ratePerMile.toFixed(2)} / mi</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Fuel Surcharge (EIA):</span>
              <span className="d-val">${activeOrder.fuelSurcharge}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Accessorial Fees:</span>
              <span className="d-val">${activeOrder.accessorialsTotal}</span>
            </div>
          </div>

          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconClock size={14} /> P03 FMCSA HOS Schedule</span>
              <span className="compliance-badge compliant">100% LEGAL</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Driving Timetable:</span>
              <span className="d-val">{activeOrder.transitHoursTotal} hrs</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Driver Mode:</span>
              <span className="d-val">{activeOrder.driverMode.toUpperCase()}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">10h Sleeper Layovers:</span>
              <span className="d-val">{activeOrder.mandatoryLayoverCount} mandatory</span>
            </div>
          </div>

          <div className="dossier-card">
            <h4>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconRadio size={14} /> P05 Telematics & BOL</span>
              <span style={{ color: '#f43f5e' }}>DISPATCHED</span>
            </h4>
            <div className="dossier-row">
              <span className="d-label">Assigned Driver:</span>
              <span className="d-val">{activeOrder.assignedDriverId}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Assigned Tractor:</span>
              <span className="d-val">{activeOrder.assignedTractorUnit}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">VICS BOL Number:</span>
              <span className="d-val">{activeOrder.bolNumber}</span>
            </div>
            <div className="dossier-row">
              <span className="d-label">Cold-Chain Setpoint:</span>
              <span className="d-val">{activeOrder.reeferSetpointF}°F</span>
            </div>
          </div>
        </aside>

        {/* Center Stage: Interactive Glass Pane */}
        <main id="main-content" className="stage-glass-pane" tabIndex={-1}>
          <div className="glass-toolbar">
            <div className="stage-title-wrap">
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ProductIcon
                  productId={
                    activeSubProduct.id === 'asset_studio'
                      ? 'product-04-asset-studio'
                      : activeSubProduct.id === 'cargo_fit'
                      ? 'product-01-cargo-fit'
                      : activeSubProduct.id === 'freight_pricing'
                      ? 'product-02-freight-pricing'
                      : activeSubProduct.id === 'hos_planner'
                      ? 'product-03-hos-planner'
                      : 'product-05-fleet-telematics'
                  }
                  size={20}
                />
              </span>
              <h2>{activeSubProduct.name}</h2>
              <span className="stage-badge">PORT {activeSubProduct.port}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>— {activeSubProduct.tagline}</span>
            </div>

            <div className="glass-actions">
              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-open-external"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Open Standalone Tab <IconExternalLink size={12} />
                </span>
              </a>
              <button
                onClick={handleAdvanceStage}
                className="btn-stage-advance"
              >
                <span>Next Tool →</span>
              </button>
            </div>
          </div>

          {/* Live Embedded Tool Iframe */}
          <div className="iframe-container">
            <iframe
              src={iframeUrl}
              title={activeSubProduct.name}
              className="portal-iframe"
            />
          </div>
        </main>
      </div>

      {/* Global Dispatch & Master Sign-Off Bar */}
      <footer className="portal-footer-bar">
        <div className="footer-summary">
          <span><strong>Active Load:</strong> {activeOrder.orderNumber}</span>
          <span><strong>Vehicle:</strong> {activeOrder.vehicleName}</span>
          <span><strong>Payload:</strong> {activeOrder.totalPayloadLbs.toLocaleString()} lbs ({activeOrder.packageCount} units)</span>
          <span><strong>Total Rate:</strong> ${activeOrder.totalCarrierPay.toLocaleString()}</span>
        </div>

        <div className="footer-actions">
          <button onClick={() => setIsEdiModalOpen(true)} className="btn-export-json primary">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconZap size={14} /> EDI Transaction Hub (204/990/214/210)</span>
          </button>
          <button onClick={() => setIsManifestModalOpen(true)} className="btn-export-json">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconFileText size={14} /> Master VICS BOL & Dispatch Packet</span>
          </button>
          <button onClick={handleExportJson} className="btn-export-json">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconDownload size={14} /> Export Master JSON</span>
          </button>
          <button onClick={() => window.print()} className="btn-print-manifest">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconPrinter size={14} /> Print Dispatch Manifest</span>
          </button>
        </div>
      </footer>

      {/* Interactive EDI Hub Modal */}
      <EdiHubModal
        order={activeOrder}
        isOpen={isEdiModalOpen}
        onClose={() => setIsEdiModalOpen(false)}
      />

      {/* Printable Master Freight BOL & Dispatch Packet Modal */}
      <DispatchManifestModal
        order={activeOrder}
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
      />

      {/* Reactive Cross-Tab Platform Event Stream Modal */}
      <PlatformEventStreamModal
        isOpen={isEventStreamModalOpen}
        onClose={() => setIsEventStreamModalOpen(false)}
        events={platformEvents}
        onClearEvents={() => setPlatformEvents([])}
      />
    </div>
  );
}
