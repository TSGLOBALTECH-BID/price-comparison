import { Product, UISpec } from '@/lib/types/chat';
import { generateLLMResponse, generatePrompt } from './prompts';

export function generateDemoResponse(query: string): string {
  // Create a dynamic demo response based on the query
  const isHeadphonesQuery = query.toLowerCase().includes('headphone') || query.toLowerCase().includes('earphone');
  const isLaptopQuery = query.toLowerCase().includes('laptop') || query.toLowerCase().includes('computer');
  const isPhoneQuery = query.toLowerCase().includes('phone') || query.toLowerCase().includes('smartphone');

  let productType = "electronics product";
  let recommendations = [];
  
    // Generic electronics response
    recommendations = [
      { name: "Premium Product A", price: "₹24,990", rating: "4.6/5", features: "High quality, great features, excellent value" },
      { name: "Best Value Product B", price: "₹18,900", rating: "4.4/5", features: "Balanced features, good performance, reliable" },
      { name: "Budget Option C", price: "₹12,999", rating: "4.2/5", features: "Essential features, decent quality, affordable" }
    ];
  

  const bestRecommendation = recommendations[1]; // Second item is typically the recommended one

  return `⚠️ **DEMO MODE**: Live data could not be loaded due to missing API keys. This response shows simulated product data for demonstration purposes only.

Analyzing query: "${query}"

🔍 Intent Analysis:
- Product Type: ${productType}
- Constraints: Price under ₹50,000
- Preferences: Best quality for price

🌐 Product Discovery:
Searching Indian e-commerce sites (Amazon.in, Flipkart.com, Croma)...
Found ${recommendations.length + 2} relevant product pages, extracting product data...

📊 Data Extraction:
Extracting product information from ${recommendations.length} top results...

⚖️ Comparison & Ranking:

🏆 Top Recommendations:

1. **${recommendations[0].name}**
   - Price: ${recommendations[0].price}
   - Rating: ${recommendations[0].rating}
   - Key Features: ${recommendations[0].features}

2. **${recommendations[1].name}**
   - Price: ${recommendations[1].price}
   - Rating: ${recommendations[1].rating}
   - Key Features: ${recommendations[1].features}

3. **${recommendations[2].name}**
   - Price: ${recommendations[2].price}
   - Rating: ${recommendations[2].rating}
   - Key Features: ${recommendations[2].features}

💡 Recommendation: ${bestRecommendation.name} offers the best balance of features and stays within your budget.

⚠️ Note: This is a demo response. Configure API keys (GROQ_API_KEY, TAVILY_API_KEY, FIRECRAWL_API_KEY) in .env.local for real AI-powered comparisons.`;
}

export function parseDemoProducts(query: string = "headphones"): Product[] {
  const isHeadphonesQuery = query.toLowerCase().includes('headphone') || query.toLowerCase().includes('earphone');
  const isLaptopQuery = query.toLowerCase().includes('laptop') || query.toLowerCase().includes('computer');
  const isPhoneQuery = query.toLowerCase().includes('phone') || query.toLowerCase().includes('smartphone');

    // Generic fallback
    return [
      {
        title: "Premium Product A",
        price: "₹24,990",
        rating: "4.6/5",
        features: ["High quality", "great features", "excellent value"],
        isRecommended: false
      },
      {
        title: "Best Value Product B",
        price: "₹18,900",
        rating: "4.4/5",
        features: ["Balanced features", "good performance", "reliable"],
        isRecommended: true
      },
      {
        title: "Budget Option C",
        price: "₹12,999",
        rating: "4.2/5",
        features: ["Essential features", "decent quality", "affordable"],
        isRecommended: false
      }
    ];
}

export function createManualUISpec(products: Product[]): UISpec {
  return {
    type: "ProductGrid",
    props: { products },
    isDemo: true,
    demoMessage: "⚠️ Live data could not be loaded due to missing API keys. This shows demo product data for demonstration purposes only."
  };
}

export async function generateUISpec(query: string): Promise<UISpec> {
  const prompt = await generatePrompt(query);

  try {
    const responseText = await generateLLMResponse(prompt);
    const parsed = JSON.parse(responseText);

    if (parsed.products && Array.isArray(parsed.products)) {
      return createManualUISpec(parsed.products);
    }
  } catch (error) {
    console.error('Error generating dynamic UI spec:', error);
  }

  // Fallback to demo products if LLM fails
  const products = parseDemoProducts(query);
  return createManualUISpec(products);
}