/** A mesh message has no reviewed shipment identity, even if it has a modeled assessment. */
export function summarizeHosScenario(payload: { totalTransitHours?: number; driverMode?: string }): string {
  const hours = typeof payload.totalTransitHours === 'number' && Number.isFinite(payload.totalTransitHours) ? `${payload.totalTransitHours} hrs` : 'duration not supplied';
  return `Scenario corridor: ${hours} (${payload.driverMode || 'driver mode not supplied'}); driver status and legal determination unverified`;
}
