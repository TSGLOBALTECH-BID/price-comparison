import { defineRegistry } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';
import { catalog } from './catalog';
import { ProductCard } from './components/ProductCard';
import { ProductGrid } from './components/ProductGrid';

export const { registry } = defineRegistry(catalog, {
  components: {
    ...shadcnComponents,
    ProductCard,
    ProductGrid,
  },
});