import React from 'react';
import { Star } from 'lucide-react';

interface ProductCardProps {
  title: string;
  price: string;
  rating?: string;
  features?: string[];
  isRecommended?: boolean;
  sourceUrl?: string;
}

// Simple custom badge component
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function ProductCard(ctx: { props: ProductCardProps }) {
  const { title, price, rating, features, isRecommended, sourceUrl } = ctx.props;
  return (
    <div className={`relative bg-white border rounded-lg shadow-md p-4 ${isRecommended ? 'border-green-500 border-2' : 'border-gray-200'}`}>
      {isRecommended && (
        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">Recommended</Badge>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-green-600">{price}</span>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">{rating}</span>
            </div>
          )}
        </div>
      </div>
      {features && features.length > 0 && (
        <div className="mt-4">
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      {sourceUrl && (
        <div className="mt-2 text-sm text-gray-600">
          Source: <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{sourceUrl}</a>
        </div>
      )}
    </div>
  );
}
