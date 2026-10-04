export interface Division { id: string; name: string; }
export interface District { id: string; divisionId: string; name: string; }
export interface Upazila { id: string; districtId: string; name: string; }
export interface PostOffice { id: string; upazilaId: string; name: string; postalCode: string; }
