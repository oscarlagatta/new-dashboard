// Legacy synchronous mock-data export, kept while consumers transition to
// `useVulnerabilities()` in `lib/api/hooks.ts`. Sources its rows from the
// same in-memory store that backs the mock API route handlers, adapted to
// the FE `Vulnerability` shape — one source of truth.

import { fromApiRow } from "./api/adapters";
import { VULNERABILITY_ROWS } from "./mock-api/data";
import type {
  CioTeam,
  SparklineDataPoint,
  User,
  Vulnerability,
} from "./types";

export const CIO_TEAMS: CioTeam[] = [
  { id: "1", name: "James Hartley" },
  { id: "2", name: "Patricia Owens" },
  { id: "3", name: "Raj Mehta" },
  { id: "4", name: "Sandra Corrigan" },
  { id: "5", name: "Marcus Webb" },
  { id: "6", name: "Claire Fontaine" },
  { id: "7", name: "Derek Okonkwo" },
];

export const USERS: User[] = [
  { id: "1", name: "Scott Zhang", email: "scott.zhang@bank.internal", initials: "SZ" },
  { id: "2", name: "Priyanka Gupta", email: "priyanka.gupta@bank.internal", initials: "PG" },
  { id: "3", name: "Sandip K Dube", email: "sandip.dube@bank.internal", initials: "SD" },
  { id: "4", name: "Sushma Deepika Rupakula", email: "sushma.rupakula@bank.internal", initials: "SR" },
  { id: "5", name: "Rekha Patel", email: "rekha.patel@bank.internal", initials: "RP" },
  { id: "6", name: "Maiko Arai", email: "maiko.arai@bank.internal", initials: "MA" },
  { id: "7", name: "Mark Farr", email: "mark.farr@bank.internal", initials: "MF" },
  { id: "8", name: "Manas Chanda", email: "manas.chanda@bank.internal", initials: "MC" },
  { id: "9", name: "Chris Boswell", email: "chris.boswell@bank.internal", initials: "CB" },
  { id: "10", name: "Saurabh Sharma", email: "saurabh.sharma@bank.internal", initials: "SS" },
  { id: "11", name: "Barbara Billups", email: "barbara.billups@bank.internal", initials: "BB" },
  { id: "12", name: "Rachael B Kotch", email: "rachael.kotch@bank.internal", initials: "RK" },
  { id: "13", name: "Kenneth K Lee", email: "kenneth.lee@bank.internal", initials: "KL" },
];

export function generateSparklineData(base: number, seed: number): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const offset = Math.round(base * 0.15 * Math.sin((i + seed) * 0.7));
    data.push({ day: 13 - i, value: Math.max(0, base + offset) });
  }
  return data;
}

// Pre-adapted FE rows for legacy synchronous consumers. New code should
// fetch via `useVulnerabilities()` so it picks up bulk-update mutations.
export const mockVulnerabilities: Vulnerability[] = VULNERABILITY_ROWS.map(fromApiRow);
