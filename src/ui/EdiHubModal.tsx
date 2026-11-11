import React, { useEffect, useState } from 'react';
import { FreightOrderSpec } from '../engine/types';
import {
  generateEdi204,
  generateEdi990,
  generateEdi214,
  generateEdi210,
  EdiDocumentBundle,
} from '../engine/ediGenerator';
import { IconZap, IconX, IconClipboard, IconDownload } from './icons';

interface EdiHubModalProps {
  order: FreightOrderSpec;
  isOpen: boolean;
  onClose: () => void;
}

export const EdiHubModal: React.FC<EdiHubModalProps> = ({ order, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'204' | '990' | '214' | '210'>('204');
  const [tenderResponse, setTenderResponse] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'segments' | 'raw' | 'json'>('segments');
  const [copiedNote, setCopiedNote] = useState<string | null>(null);
  useEffect(() => { setTenderResponse(null); }, [order.orderId]);

  if (!isOpen) return null;

  const bundles: Record<string, EdiDocumentBundle> = {
    '204': generateEdi204(order),
    '990': tenderResponse === null ? generateEdi204(order) : generateEdi990(order, tenderResponse),
    '214': generateEdi214(order),
    '210': generateEdi210(order),
  };

  const currentBundle = bundles[activeTab];
  const needsTenderResponse = activeTab === '990' && tenderResponse === null;

  const handleCopyRaw = () => {
    if (needsTenderResponse) return;
    navigator.clipboard.writeText(currentBundle.rawX12);
    setCopiedNote(`Copied EDI ${activeTab} Raw X12 to clipboard!`);
    setTimeout(() => setCopiedNote(null), 3000);
  };

  const handleDownload = () => {
    if (needsTenderResponse) return;
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(currentBundle.rawX12);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${order.orderNumber}_EDI${activeTab}.x12`);
    dlAnchor.click();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="edi-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="edi-modal-header">
          <div className="header-title-row">
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b' }}><IconZap size={20} /></span>
            <div>
              <h3>ANSI ASC X12 EDI TRANSACTION HUB</h3>
              <span className="subtitle">
                Scenario examples only · No transaction is transmitted · Order {order.orderNumber}
              </span>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose}><IconX size={16} /></button>
        </div>

        {/* Transaction Set Tabs */}
        <div className="edi-tabs-bar">
          <button
            className={`edi-tab ${activeTab === '204' ? 'active' : ''}`}
            onClick={() => setActiveTab('204')}
          >
            <span className="tab-code">EDI 204</span>
            <span className="tab-name">Load Tender</span>
          </button>
          <button
            className={`edi-tab ${activeTab === '990' ? 'active' : ''}`}
            onClick={() => setActiveTab('990')}
          >
            <span className="tab-code">EDI 990</span>
            <span className="tab-name">Tender Response</span>
          </button>
          <button
            className={`edi-tab ${activeTab === '214' ? 'active' : ''}`}
            onClick={() => setActiveTab('214')}
          >
            <span className="tab-code">EDI 214</span>
            <span className="tab-name">Shipment Status</span>
          </button>
          <button
            className={`edi-tab ${activeTab === '210' ? 'active' : ''}`}
            onClick={() => setActiveTab('210')}
          >
            <span className="tab-code">EDI 210</span>
            <span className="tab-name">Freight Invoice</span>
          </button>
        </div>

        {activeTab === '990' && <label>Choose a simulated tender response: <select value={tenderResponse === null ? '' : String(tenderResponse)} onChange={e => setTenderResponse(e.target.value === '' ? null : e.target.value === 'true')}><option value="">Choose response</option><option value="true">Accept example</option><option value="false">Decline example</option></select></label>}
        {/* Action Controls & Format Selector */}
        <div className="edi-toolbar">
          <div className="doc-meta-info">
            {!needsTenderResponse && <><span className="badge-standard">{currentBundle.standard}</span>
            <span className="badge-direction">{currentBundle.direction}</span></>}
          </div>

          <div className="view-toggle-group">
            <button
              className={`view-btn ${viewMode === 'segments' ? 'active' : ''}`}
              onClick={() => setViewMode('segments')}
            >
              Segment Explorer
            </button>
            <button
              className={`view-btn ${viewMode === 'raw' ? 'active' : ''}`}
              onClick={() => setViewMode('raw')}
            >
              Raw X12
            </button>
            <button
              className={`view-btn ${viewMode === 'json' ? 'active' : ''}`}
              onClick={() => setViewMode('json')}
            >
              JSON Tree
            </button>
          </div>

          <div className="modal-actions-right">
            {copiedNote && <span className="copy-notice">{copiedNote}</span>}
            <button disabled={needsTenderResponse} onClick={handleCopyRaw} className="btn-copy-action">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconClipboard size={14} /> Copy X12</span>
            </button>
            <button disabled={needsTenderResponse} onClick={handleDownload} className="btn-dl-action">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconDownload size={14} /> Download .x12</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="edi-modal-body">
          {needsTenderResponse && <p>Select a simulated response to view or export EDI 990.</p>}
          {!needsTenderResponse && viewMode === 'segments' && (
            <div className="segment-explorer-view">
              <div className="segment-list">
                {currentBundle.parsedSegments.map((seg, idx) => (
                  <div key={idx} className="segment-card">
                    <div className="seg-card-header">
                      <span className="seg-tag">{seg.segmentId}</span>
                      <span className="seg-name">{seg.name}</span>
                      <span className="seg-raw-preview">{seg.raw}</span>
                    </div>
                    <p className="seg-purpose">{seg.purpose}</p>

                    <table className="seg-fields-table">
                      <thead>
                        <tr>
                          <th>Element</th>
                          <th>Data Element Name</th>
                          <th>Value</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seg.fields.map((f, fIdx) => (
                          <tr key={fIdx}>
                            <td className="col-tag">{f.tag}</td>
                            <td className="col-name">{f.name}</td>
                            <td className="col-val">{f.value}</td>
                            <td className="col-desc">{f.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!needsTenderResponse && viewMode === 'raw' && (
            <div className="raw-x12-view">
              <pre className="x12-code-box">
                {currentBundle.rawX12.split('\n').map((line, lIdx) => (
                  <div key={lIdx} className="x12-line">
                    <span className="line-num">{String(lIdx + 1).padStart(2, '0')}</span>
                    <span className="line-content">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          )}

          {!needsTenderResponse && viewMode === 'json' && (
            <div className="json-tree-view">
              <pre className="json-code-box">
                {JSON.stringify(currentBundle.jsonObj, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
