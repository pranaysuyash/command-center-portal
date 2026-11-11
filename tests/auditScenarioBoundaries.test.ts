import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PRESET_ORDERS } from '../src/engine/lifecycle';
import { generateEdi990 } from '../src/engine/ediGenerator';
import { ExceptionControlTower } from '../src/ui/ExceptionControlTower';
import { DispatchManifestModal } from '../src/ui/DispatchManifestModal';
import { summarizeHosScenario } from '../src/engine/scenarioEvent';

describe('scenario authority boundaries', () => {
  it('does not turn a legacy or modeled HOS broadcast into a legal determination', () => {
    for (const extra of [{ isLegal: true }, { isLegal: false }, { assessment: 'indeterminate' }, {}]) {
      expect(summarizeHosScenario({ totalTransitHours: 3, driverMode: 'solo', ...extra })).toContain('legal determination unverified');
    }
  });
  it('requires an explicit tender response and does not say accepted on a decline', () => {
    expect(() => generateEdi990(DEFAULT_PRESET_ORDERS[0], undefined as unknown as boolean)).toThrow();
    const declined = generateEdi990(DEFAULT_PRESET_ORDERS[0], false);
    expect(declined.rawX12).not.toContain('ACCEPTED UNDER RATE CONFIRMATION');
    expect(declined.rawX12).toContain('DECLINED');
  });
  it('identifies sample exceptions and does not count them as mesh alerts', () => {
    const html = renderToStaticMarkup(createElement(ExceptionControlTower, { liveEvents: [] }));
    expect(html).toContain('0 UNVERIFIED MESH ALERTS');
    expect(html).toContain('EXAMPLE:');
  });
  it('does not print a shipper or driver signature for a scenario', () => {
    const html = renderToStaticMarkup(createElement(DispatchManifestModal, { order: DEFAULT_PRESET_ORDERS[0], isOpen: true, onClose: () => {} }));
    expect(html).toContain('NO SHIPPER SIGNATURE RECORDED');
    expect(html).toContain('NO DRIVER SIGNATURE OR ACCEPTANCE RECORDED');
    expect(html).not.toContain('Authorize &amp; Sign');
  });
});
