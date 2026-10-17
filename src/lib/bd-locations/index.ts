import data from "./data.json";

export interface Division { id: string; name: string; }
export interface District { id: string; divisionId: string; name: string; }
export interface Upazila { id: string; districtId: string; name: string; }
export interface PostOffice { id: string; upazilaId: string; name: string; postalCode: string; }

/**
 * Bundled Bangladesh location hierarchy (8 divisions, 64 districts, upazilas
 * plus Dhaka city thanas). Bundled so address forms never depend on a
 * third-party API being up.
 */
const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export const DIVISIONS: Division[] = [...data.divisions].sort(byName);

export const districtsOf = (divisionId: string): District[] =>
  data.districts.filter((d) => d.divisionId === divisionId).sort(byName);

export const thanasOf = (districtId: string): Upazila[] =>
  data.upazilas.filter((u) => u.districtId === districtId).sort(byName);
