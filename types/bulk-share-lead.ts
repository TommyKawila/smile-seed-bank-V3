export type BulkShareLeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

export type BulkShareLeadItemRecord = {
  id: string;
  supplierSlug: string;
  supplierLabel: string;
  strainName: string;
  category: string;
  qty: number;
  unitThb: number;
  unitEur: number;
  lineThb: number;
};

export type BulkShareLeadRecord = {
  id: string;
  refNumber: string;
  contactName: string;
  email: string;
  lineId: string;
  phone: string;
  note: string | null;
  shareTitle: string;
  suppliers: string[];
  eurThb: number;
  subtotalThb: number;
  subtotalEur: number;
  seedCount: number;
  status: BulkShareLeadStatus;
  createdAt: string;
  items: BulkShareLeadItemRecord[];
};

export type CreateBulkShareLeadInput = {
  contactName: string;
  email?: string;
  lineId?: string;
  phone?: string;
  note?: string;
  shareTitle: string;
  suppliers: string[];
  eurThb: number;
  seedCount: number;
  subtotalThb: number;
  subtotalEur: number;
  items: {
    supplierSlug: string;
    supplierLabel: string;
    strainName: string;
    category: string;
    qty: number;
    unitThb: number;
    unitEur: number;
    lineThb: number;
  }[];
};
