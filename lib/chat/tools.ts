import { tavily } from '@tavily/core';
import FirecrawlApp from '@mendable/firecrawl-js';

const tavilyClient = process.env.TAVILY_API_KEY ? tavily({ apiKey: process.env.TAVILY_API_KEY }) : null;
const firecrawlApp = process.env.FIRECRAWL_API_KEY ? new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY }) : null;

export async function searchWithTavily(query: string, maxResults: number = 10) {
  if (!tavilyClient) {
    throw new Error('Tavily API key not configured');
  }

  // Enhance query to target specific product pages with pricing, specs, and reviews
  const enhancedQuery = `${query} buy price specifications review India`;

  const result = await tavilyClient.search(enhancedQuery, {
    maxResults: maxResults + 5, // fetch extra then filter for product pages
    searchDepth: 'advanced',
    includeDomains: ['amazon.in', 'flipkart.com', 'croma.com', 'reliance.com'],
    includeAnswer: true,
    includeRawContent: 'markdown',
  });

  type TavilySearchResult = {
    title?: string;
    url?: string;
    content?: string;
    rawContent?: string;
    score?: number;
    productScore?: number;
    [key: string]: unknown;
  };

  // Score and prefer actual product detail pages over category/home pages
  const scoredResults = (result.results as TavilySearchResult[]).map((r) => {
    const url: string = r.url || '';
    let productScore = (r.score || 0) as number;

    // Strong boost for direct product detail URLs
    if (url.includes('/dp/') || url.includes('/p/itm') || url.includes('/product/')) {
      productScore += 0.35;
    }
    // Boost for long, specific slugs (typical of product pages)
    if (/\/[a-z0-9-]{12,}\//.test(url)) {
      productScore += 0.15;
    }
    // Penalize obvious category/search pages
    if (url.includes('/s?') || url.includes('/search?') || url.includes('/category/') || url.includes('/store/')) {
      productScore -= 0.25;
    }

    return {
      ...r,
      productScore,
    } as TavilySearchResult;
  });

  // Sort by our product-specific score and trim
  scoredResults.sort((a, b) => (b.productScore || 0) - (a.productScore || 0));

  return scoredResults.slice(0, maxResults).map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content || r.rawContent,
    score: r.productScore,
  }));
}

export async function extractWithFirecrawl(url: string) {
  if (!firecrawlApp) {
    throw new Error('Firecrawl API key not configured');
  }
  const scrapeResult = await firecrawlApp.scrape(url, {
    formats: ['markdown', 'html'],
    onlyMainContent: true,
  });
  return scrapeResult;
}
