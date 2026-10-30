import React, { useEffect, useState } from 'react';
import { FreightOrderSpec } from '../engine/types';
import { IconFileText, IconPrinter, IconX, IconCheck } from './icons';

interface DispatchManifestModalProps {
  order: FreightOrderSpec;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchManifestModal: React.FC<DispatchManifestModalProps> = ({ order, isOpen, onClose }) => {
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [approvalTimestamp, setApprovalTimestamp] = useState<string | null>(null);
  useEffect(() => { setIsApproved(false); setApprovalTimestamp(null); }, [order.orderId, order.totalPayloadLbs, order.vehicleId]);

  if (!isOpen) return null;

  // Engineering calculation of estimated axle weight distribution from actual payload
  const tractorTare = 18000;
  const trailerTare = 14000;
  const totalTare = tractorTare + trailerTare;
  const estimatedGvw = totalTare + order.totalPayloadLbs;
  const steerAxleLbs = Math.round(10800 + (order.totalPayloadLbs * 0.04));
  const remainingPayload = Math.max(0, order.totalPayloadLbs - (steerAxleLbs - 10800));
  const driveTandemLbs = Math.round(10200 + remainingPayload * 0.48);
  const trailerTandemLbs = Math.round(11000 + remainingPayload * 0.52);

  const steerPass = steerAxleLbs <= 12000;
  const drivePass = driveTandemLbs <= 34000;
  const trailerPass = trailerTandemLbs <= 34000;
  const gvwPass = estimatedGvw <= 80000;
  const allAxlesModeledFeasible = steerPass && drivePass && trailerPass && gvwPass;

  const handleApprove = () => {
    if (!allAxlesModeledFeasible) return;
    setIsApproved(true);
    setApprovalTimestamp(new Date().toLocaleString());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="manifest-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="manifest-modal-toolbar no-print">
          <div className="toolbar-left">
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#38bdf8' }}><IconFileText size={18} /></span>
            <strong>MASTER FREIGHT BILL OF LADING & DISPATCH PACKET</strong>
            <span className={`status-pill ${isApproved ? 'status-normal' : 'status-caution'}`} style={{ marginLeft: '12px' }}>
              {isApproved ? 'OPERATOR APPROVED' : 'DRAFT — PENDING AUDIT'}
            </span>
          </div>
          <div className="toolbar-right">
            {!isApproved && (
              <button onClick={handleApprove} className="btn-modal-print" style={{ background: '#10b981', borderColor: '#059669' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconCheck size={14} /> Authorize & Sign</span>
              </button>
            )}
            <button onClick={() => window.print()} className="btn-modal-print">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconPrinter size={14} /> Print Document</span>
            </button>
            <button onClick={onClose} className="btn-modal-close">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconX size={14} /> Close</span>
            </button>
          </div>
        </div>

        {/* Printable Master BOL Sheet */}
        <div className="printable-bol-sheet">
          {!isApproved && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '4px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              NOTICE: DRAFT OPERATIONAL PLAN ONLY · NOT AUTHORIZED FOR HIGHWAY TRANSIT UNTIL SCALE WEIGH-IN & SIGNED APPROVAL
            </div>
          )}

          {/* Header */}
          <div className="bol-header-grid">
            <div className="bol-shipper-col">
              <div className="bol-brand-name">VICS STANDARD BILL OF LADING</div>
              <div className="bol-sub-standard">CONFORMS TO GS1 US LOGISTICS SPECIFICATIONS (SIMULATED SCENARIO)</div>
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
                <td>{order.packageName} — Commercial Freight (Modeled)</td>
                <td>156600</td>
                <td>70</td>
                <td>{order.totalPayloadLbs.toLocaleString()} lbs</td>
              </tr>
              <tr className="cargo-total-row">
                <td colSpan={6} style={{ textAlign: 'right' }}><strong>TOTAL DECLARED PAYLOAD:</strong></td>
                <td><strong>{order.totalPayloadLbs.toLocaleString()} lbs</strong></td>
              </tr>
            </tbody>
          </table>

          {/* Engineering Weight Distribution & Compliance */}
          <div className="bol-compliance-section">
            <div className="compliance-box">
              <div className="box-title">ESTIMATED AXLE LOAD DISTRIBUTION (49 CFR § 658.17 SCREENING)</div>
              <div className="axle-table-row">
                <span>Steer Axle: ~{steerAxleLbs.toLocaleString()} lbs (Limit 12,000 lbs)</span>
                <span className={steerPass ? 'badge-legal' : 'badge-caution'}>
                  {steerPass ? 'ESTIMATED OK' : 'OVER LIMIT'}
                </span>
              </div>
              <div className="axle-table-row">
                <span>Drive Tandem: ~{driveTandemLbs.toLocaleString()} lbs (Limit 34,000 lbs)</span>
                <span className={drivePass ? 'badge-legal' : 'badge-caution'}>
                  {drivePass ? 'ESTIMATED OK' : 'OVER LIMIT'}
                </span>
              </div>
              <div className="axle-table-row">
                <span>Trailer Tandem: ~{trailerTandemLbs.toLocaleString()} lbs (Limit 34,000 lbs)</span>
                <span className={trailerPass ? 'badge-legal' : 'badge-caution'}>
                  {trailerPass ? 'ESTIMATED OK' : 'OVER LIMIT'}
                </span>
              </div>
              <div className="axle-table-row">
                <span>Estimated Gross Vehicle Weight (GVW): ~{estimatedGvw.toLocaleString()} lbs (Limit 80,000 lbs)</span>
                <span className={gvwPass ? 'badge-legal' : 'badge-caution'}>
                  {gvwPass ? 'ESTIMATED OK' : 'OVER LIMIT'}
                </span>
              </div>
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                Note: Axle estimates modeled from standard 53ft tare and cargo CG. Subject to physical scale verification prior to highway transit.
              </p>
            </div>

            <div className="compliance-box">
              <div className="box-title">FMCSA PART 395 HOURS OF SERVICE SCHEDULE</div>
              <p>Total Corridor Distance: <strong>{order.distanceMiles} miles</strong></p>
              <p>Estimated Driving Time: <strong>{order.transitHoursTotal} hours</strong></p>
              <p>Driver Mode: <strong>{order.driverMode.toUpperCase()}</strong></p>
              <p>Mandatory 10h Sleeper Layovers: <strong>{order.mandatoryLayoverCount} Layover(s) Scheduled</strong></p>
              <p>Compliance Evaluation: <strong>
                {order.hosComplianceStatus === 'legal'
                  ? 'MODELED ITINERARY FEASIBLE (Subject to Driver Logbook Actuals)'
                  : 'HOS REVIEW REQUIRED'}
              </strong></p>
            </div>
          </div>

          {/* Signatures & Execution Section */}
          <div className="bol-signatures-grid">
            <div className="sig-block">
              <span className="sig-role">SHIPPER SIGNATURE / DATE:</span>
              <div className="sig-line">
                {isApproved ? (
                  <span className="sig-stamp" style={{ color: '#059669' }}>
                    APPROVED BY DISPATCH ({approvalTimestamp})
                  </span>
                ) : (
                  <span className="sig-placeholder">[ PENDING OPERATOR AUTHORIZATION ]</span>
                )}
              </div>
              <p className="sig-sub">Shipper certifies goods are packaged, marked, and labeled in accordance with DOT specifications.</p>
            </div>

            <div className="sig-block">
              <span className="sig-role">CARRIER DRIVER SIGNATURE / DATE:</span>
              <div className="sig-line">
                {isApproved ? (
                  <span className="sig-stamp" style={{ color: '#0284c7' }}>
                    DOCK TENDER ACCEPTED · {order.assignedDriverId.split(' ')[0]}
                  </span>
                ) : (
                  <span className="sig-placeholder">[ PENDING CARRIER DOCK SIGN-OFF ]</span>
                )}
              </div>
              <p className="sig-sub">Carrier acknowledges receipt of packages in apparent good order. Subject to dock seal verification.</p>
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
            Generated by TRUCKING Unified Command Center Portal (Port 5170) · Operational Planning & Dispatch Manifest · Subject to physical scale weigh-in
          </div>
        </div>
      </div>
    </div>
  );
};
