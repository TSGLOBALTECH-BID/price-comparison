export interface MessagePart {
  type: string;
  text?: string;
}

export interface Product {
  title: string;
  price: string;
  rating: string;
  features: string[];
  isRecommended: boolean;
  sourceUrl?: string;
}

export interface ProductData {
  title: string;
  price: number;
  rating: number | null;
}

export interface UISpec {
  type: string;
  props: {
    products: Product[];
  };
  isDemo?: boolean;
  demoMessage?: string;
}

export interface ChatRequest {
  messages: Array<{
    parts: MessagePart[];
  }>;
  format?: 'text' | 'ui';
}