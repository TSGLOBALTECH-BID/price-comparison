import { ProductData } from '@/lib/types/chat';

export function parseProductData(markdown: string): ProductData | null {
  // Simple extraction logic - in real implementation, use better parsing
  const titleMatch = markdown.match(/# (.+)/);
  const priceMatch = markdown.match(/₹(\d+)/);
  const ratingMatch = markdown.match(/(\d\.\d) stars?/);

  if (titleMatch && priceMatch) {
    return {
      title: titleMatch[1],
      price: parseInt(priceMatch[1]),
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    };
  }
  return null;
}

export function hasValidApiKeys(): {
  hasGroq: boolean;
  hasTavily: boolean;
  hasFirecrawl: boolean;
} {
  return {
    hasGroq: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here'),
    hasTavily: Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here'),
    hasFirecrawl: Boolean(process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'your_firecrawl_api_key_here'),
  };
}