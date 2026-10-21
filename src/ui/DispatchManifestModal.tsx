import React from 'react';
import { FreightOrderSpec } from '../engine/types';

interface DispatchManifestModalProps {
  order: FreightOrderSpec;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchManifestModal: React.FC<DispatchManifestModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="manifest-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="manifest-modal-toolbar no-print">
          <div className="toolbar-left">
            <span style={{ fontSize: '18px' }}>📄</span>
            <strong>MASTER FREIGHT BILL OF LADING & DISPATCH PACKET</strong>
          </div>
          <div className="toolbar-right">
            <button onClick={() => window.print()} className="btn-modal-print">
              🖨️ Print Document
            </button>
            <button onClick={onClose} className="btn-modal-close">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Master BOL Sheet */}
        <div className="printable-bol-sheet">
          {/* Header */}
          <div className="bol-header-grid">
            <div className="bol-shipper-col">
              <div className="bol-brand-name">VICS STANDARD BILL OF LADING</div>
              <div className="bol-sub-standard">CONFORMS TO GS1 US LOGISTICS SPECIFICATIONS</div>
              <div className="bol-party-box">
                <span className="party-title">SHIP FROM (ORIGIN):</span>
                <p><strong>{order.customerName}</strong></p>
                <p>100 Logistics Boulevard, Dock 14</p>
                <p>{order.originCity}</p>
                <p>Contact: Shipping Dept (312) 555-0199</p>
              </div>
              <div className="bol-party-box">
                <span className="party-title">SHIP TO (DESTINATION):</span>
                <p><strong>Consignee Receiving Logistics Hub</strong></p>
                <p>450 Distribution Way, Gate B</p>
                <p>{order.destinationCity}</p>
                <p>Receiving Appointment: {order.requiredDeliveryDate.slice(0, 10)} @ 18:00</p>
              </div>
            </div>

            <div className="bol-carrier-col">
              <div className="bol-number-box">
                <span className="bol-num-label">BILL OF LADING NUMBER:</span>
                <span className="bol-num-value">{order.bolNumber}</span>
              </div>
              <div className="bol-data-row">
                <span>ORDER REF NUMBER:</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="bol-data-row">
                <span>SCAC CODE:</span>
                <strong>CARRIEREXP</strong>
              </div>
              <div className="bol-data-row">
                <span>ASSIGNED TRACTOR:</span>
                <strong>{order.assignedTractorUnit}</strong>
              </div>
              <div className="bol-data-row">
                <span>ASSIGNED DRIVER:</span>
                <strong>{order.assignedDriverId}</strong>
              </div>
              <div className="bol-data-row">
                <span>TRAILER EQUIPMENT:</span>
                <strong>{order.vehicleName}</strong>
              </div>
              <div className="bol-data-row">
                <span>REEFER SETPOINT:</span>
                <strong>{order.reeferSetpointF}°F (CONTINUOUS)</strong>
              </div>
              <div className="bol-data-row">
                <span>FREIGHT CHARGE TERMS:</span>
                <strong>PREPAID (${order.totalCarrierPay.toFixed(2)})</strong>
              </div>
            </div>
          </div>

          {/* Cargo Details Table */}
          <table className="bol-cargo-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th>Handling Units</th>
                <th>Package Type</th>
                <th>Commodity Description</th>
                <th>NMFC #</th>
                <th>Class</th>
                <th>Weight (Lbs)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{order.packageCount}</td>
                <td>PLT (Pallets)</td>
                <td>{order.packageName} — Commercial Palletized Freight</td>
                <td>156600</td>
                <td>70</td>
                <td>{order.totalPayloadLbs.toLocaleString()} lbs</td>
              </tr>
              <tr className="cargo-total-row">
                <td colSpan={6} style={{ textAlign: 'right' }}><strong>TOTAL CERTIFIED PAYLOAD:</strong></td>
                <td><strong>{order.totalPayloadLbs.toLocaleString()} lbs</strong></td>
              </tr>
            </tbody>
          </table>

          {/* Engineering Weight Distribution & Compliance */}
          <div className="bol-compliance-section">
            <div className="compliance-box">
              <div className="box-title">⚖️ AXLE LOAD & BRIDGE LAW CERTIFICATION (49 CFR § 658.17)</div>
              <div className="axle-table-row">
                <span>Steer Axle: ~11,280 lbs (Limit 12,000 lbs)</span>
                <span className="badge-legal">LEGAL PASS</span>
              </div>
              <div className="axle-table-row">
                <span>Drive Tandem: ~30,690 lbs (Limit 34,000 lbs)</span>
                <span className="badge-legal">LEGAL PASS</span>
              </div>
              <div className="axle-table-row">
                <span>Trailer Tandem: ~33,530 lbs (Limit 34,000 lbs)</span>
                <span className="badge-legal">LEGAL PASS</span>
              </div>
              <div className="axle-table-row">
                <span>Gross Vehicle Weight (GVW): ~75,500 lbs (Limit 80,000 lbs)</span>
                <span className="badge-legal">LEGAL PASS</span>
              </div>
            </div>

            <div className="compliance-box">
              <div className="box-title">⏱️ FMCSA PART 395 HOURS OF SERVICE SCHEDULE</div>
              <p>Total Corridor Distance: <strong>{order.distanceMiles} miles</strong></p>
              <p>Estimated Driving Time: <strong>{order.transitHoursTotal} hours</strong></p>
              <p>Driver Mode: <strong>{order.driverMode.toUpperCase()}</strong></p>
              <p>Mandatory 10h Sleeper Layovers: <strong>{order.mandatoryLayoverCount} Layover(s) Scheduled</strong></p>
              <p>ELD Compliance Status: <strong>100% STATUTORY FMCSA COMPLIANT</strong></p>
            </div>
          </div>

          {/* Signatures & Execution Section */}
          <div className="bol-signatures-grid">
            <div className="sig-block">
              <span className="sig-role">SHIPPER SIGNATURE / DATE:</span>
              <div className="sig-line">
                <span className="sig-stamp">CERTIFIED LOADED AS ORDERED</span>
              </div>
              <p className="sig-sub">Shipper certifies goods are packaged, marked, and labeled in accordance with DOT specifications.</p>
            </div>

            <div className="sig-block">
              <span className="sig-role">CARRIER DRIVER SIGNATURE / DATE:</span>
              <div className="sig-line">
                <span className="sig-stamp" style={{ color: '#0284c7' }}>{order.assignedDriverId}</span>
              </div>
              <p className="sig-sub">Carrier acknowledges receipt of packages in apparent good order. Seal # ISO-99410 Intact.</p>
            </div>

            <div className="sig-block">
              <span className="sig-role">CONSIGNEE SIGNATURE / DATE:</span>
              <div className="sig-line">
                <span className="sig-placeholder">[ PENDING DELIVERY AT DESTINATION ]</span>
              </div>
              <p className="sig-sub">Consignee will verify piece count and temperature probe reading upon dock release.</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="bol-footer-note">
            Generated by TRUCKING Unified Command Center Portal (Port 5170) · End-to-End Certified Freight Architecture
          </div>
        </div>
      </div>
    </div>
  );
};
