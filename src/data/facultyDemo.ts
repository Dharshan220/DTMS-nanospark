/**
 * DEMO-ONLY data services for the Faculty panel.
 *
 * These do NOT touch the real transport server and must never claim to have
 * delivered anything. They exist so the UI is complete before the real
 * dispatch / GPS / check-in integrations are wired up. Replace the
 * implementations with real API calls when the backend endpoints exist.
 */

import { stableHash } from "@/lib/faculty";

/**
 * Deterministic per-route-per-day trip state used to occasionally flag a
 * delayed trip on the dashboard. Replace with real trip data from the server.
 */
export function demoTripState(routeNumber: number, date: string): { delayed: boolean } {
  const hash = stableHash(`trip|${routeNumber}|${date}`);
  return { delayed: hash % 7 === 0 };
}