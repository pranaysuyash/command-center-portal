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
import { SuiteDock } from './SuiteDock';
import { EdiHubModal } from './EdiHubModal';
import { DispatchManifestModal } from './DispatchManifestModal';
import { TelemetryTicker } from './TelemetryTicker';

export function App() {
  const [initialState] = useState(() => loadSavedLifecycleState());
  const [currentStage, setCurrentStage] = useState<LifecycleStageId>(initialState.currentStage);
  const [completedStages, setCompletedStages] = useState<LifecycleStageId[]>(initialState.completedStages);
  const [activeOrder, setActiveOrder] = useState<FreightOrderSpec>(initialState.activeOrder);
  const [isEdiModalOpen, setIsEdiModalOpen] = useState<boolean>(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState<boolean>(false);

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
      <SuiteDock currentProductId="command-center-portal" />
      {/* Master Command Bar Header */}
      <header className="portal-header">
        <div className="header-brand">
          <div className="brand-shield">🚛</div>
          <div className="brand-text">
            <h1>TRUCKING COMMAND CENTER</h1>
            <span>UNIFIED FREIGHT & FLEET LIFECYCLE PORTAL · PORT 5170</span>
          </div>
        </div>

        {/* Live Subproduct Heartbeat Monitors */}
        <div className="fleet-heartbeats-row">
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
        </div>

        {/* Master Order Preset Selector */}
        <div className="order-selector-box">
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>ACTIVE LOAD:</span>
          <select
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

      {/* Live Fleet Telemetry Stream Ticker */}
      <TelemetryTicker />

      {/* Global 5-Stage Stepper Ribbon */}
      <div className="lifecycle-ribbon">
        {SUB_PRODUCTS.map((prod, idx) => {
          const isCurrent = currentStage === prod.id;
          const isCompleted = completedStages.includes(prod.id);

          return (
            <button
              key={prod.id}
              onClick={() => handleSelectStage(prod.id)}
              className={`step-card-btn ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-icon-bubble">{prod.icon}</div>
              <div className="step-info-col">
                <div className="step-code-row">
                  <span>STAGE 0{idx + 1} · {prod.code}</span>
                  {isCompleted && <span style={{ color: '#10b981' }}>✓ DONE</span>}
                </div>
                <div className="step-name">{prod.name}</div>
                <div className="step-tagline">{prod.tagline}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split Layout */}
      <div className="portal-main-layout">
        {/* Left Sidebar: Master Freight Dossier */}
        <aside className="order-dossier-panel">
          <div className="dossier-card">
            <h4>
              <span>📋 Order Overview</span>
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
              <span>🚛 P04 Equipment Spec</span>
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
              <span>📦 P01 Cargo & Axle Fit</span>
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
              <span>💰 P02 Freight Pricing</span>
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
              <span>⏱️ P03 FMCSA HOS Schedule</span>
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
              <span>📡 P05 Telematics & BOL</span>
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
        <main className="stage-glass-pane">
          <div className="glass-toolbar">
            <div className="stage-title-wrap">
              <span style={{ fontSize: '18px' }}>{activeSubProduct.icon}</span>
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
                <span>↗ Open Standalone Tab</span>
              </a>
              <button
                onClick={handleAdvanceStage}
                className="btn-stage-advance"
              >
                <span>Next Stage →</span>
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
            <span>⚡ EDI Transaction Hub (204/990/214/210)</span>
          </button>
          <button onClick={() => setIsManifestModalOpen(true)} className="btn-export-json">
            <span>📄 Master VICS BOL & Dispatch Packet</span>
          </button>
          <button onClick={handleExportJson} className="btn-export-json">
            <span>💾 Export Master JSON</span>
          </button>
          <button onClick={() => window.print()} className="btn-print-manifest">
            <span>🖨️ Print Dispatch Manifest</span>
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
    </div>
  );
}
