// Backend (.NET) /api/search yanıtının TypeScript karşılıkları.

export interface ProductResult {
  catalogNumber: string;
  name: string;
  cas: string;
  packSize?: string | null;
  price?: string | null;
  purity?: string | null;
  url: string;
}

export interface SupplierResult {
  supplier: string;
  supplierUrl: string;
  searchUrl: string;
  success: boolean;
  error?: string | null;
  note?: string | null;
  products: ProductResult[];
}

export interface SearchResponse {
  cas: string;
  totalProducts: number;
  suppliers: SupplierResult[];
}
