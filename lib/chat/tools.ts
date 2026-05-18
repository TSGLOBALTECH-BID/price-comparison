import { tavily } from '@tavily/core';
import FirecrawlApp from '@mendable/firecrawl-js';

const tavilyClient = process.env.TAVILY_API_KEY ? tavily({ apiKey: process.env.TAVILY_API_KEY }) : null;
const firecrawlApp = process.env.FIRECRAWL_API_KEY ? new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY }) : null;

export async function searchWithTavily(query: string, maxResults: number = 10) {
  if (!tavilyClient) {
    throw new Error('Tavily API key not configured');
  }
  const result = await tavilyClient.search(query, {
    maxResults,
    searchDepth: 'basic',
    includeDomains: ['amazon.in', 'flipkart.com', 'croma.com', 'reliance.com'],
  });
  return result.results.map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
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
