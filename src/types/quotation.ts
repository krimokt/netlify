export interface PriceOption {
  id: string;
  price: string;
  supplier: string;
  deliveryTime: string;
  description?: string;
  modelName?: string;
  modelImage?: string;
}

export interface QuotationProduct {
  name: string;
  image: string;
  category?: string;
  description?: string;
  unitGrossWeight?: string;
}

export interface QuotationData {
  id: string;
  quotation_id: string;
  product: QuotationProduct;
  quantity: string;
  date: string;
  status: string;
  price?: string;
  shippingMethod: string;
  destination: string;
  priceOptions?: PriceOption[];
  hasImage?: boolean;
  selected_option?: number;
} 