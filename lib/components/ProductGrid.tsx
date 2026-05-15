import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  title: string;
  price: string;
  rating?: string;
  features?: string[];
  isRecommended?: boolean;
  sourceUrl?: string;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid(ctx: { props: ProductGridProps }) {
  const { products } = ctx.props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, index) => (
        <ProductCard key={index} props={product} />
      ))}
    </div>
  );
}
