import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog';
import { z } from 'zod';

export const catalog = defineCatalog(schema, {
  components: {
    ...shadcnComponentDefinitions,

    // Product specific components
    ProductCard: {
      props: z.object({
        title: z.string(),
        price: z.string(),
        rating: z.string().optional(),
        features: z.array(z.string()).optional(),
        isRecommended: z.boolean().optional(),
      }),
      slots: [],
    },

    ProductGrid: {
      props: z.object({
        products: z.array(z.object({
          title: z.string(),
          price: z.string(),
          rating: z.string().optional(),
          features: z.array(z.string()).optional(),
          isRecommended: z.boolean().optional(),
        })),
      }),
      slots: [],
    },
  },
  actions: {},
});