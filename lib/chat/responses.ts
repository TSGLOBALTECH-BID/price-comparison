import { Product, UISpec } from '@/lib/types/chat';
import { generateLLMResponse, generatePrompt } from './prompts';

export function generateDemoResponse(query: string): string {
  // Create a dynamic demo response based on the query
  const isHeadphonesQuery = query.toLowerCase().includes('headphone') || query.toLowerCase().includes('earphone');
  const isLaptopQuery = query.toLowerCase().includes('laptop') || query.toLowerCase().includes('computer');
  const isPhoneQuery = query.toLowerCase().includes('phone') || query.toLowerCase().includes('smartphone');

  let productType = "electronics product";
  let recommendations = [];

  if (isHeadphonesQuery) {
    productType = "noise-canceling headphones";
    recommendations = [
      { name: "Sony WH-1000XM5", price: "₹29,990", rating: "4.6/5", features: "Industry-leading ANC, 30hr battery, premium build" },
      { name: "Bose QuietComfort 45", price: "₹18,900", rating: "4.4/5", features: "Excellent noise cancellation, comfortable fit, good battery life" },
      { name: "JBL Live 700BTNC", price: "₹12,999", rating: "4.2/5", features: "Good ANC for price, wireless charging, JBL sound quality" }
    ];
  } else if (isLaptopQuery) {
    productType = "gaming laptops";
    recommendations = [
      { name: "ASUS ROG Strix G15", price: "₹89,990", rating: "4.7/5", features: "RTX 4060 GPU, Ryzen 7, 16GB RAM, 144Hz display" },
      { name: "Dell G5 15", price: "₹72,990", rating: "4.4/5", features: "i7 processor, GTX 1650, 8GB RAM, 120Hz display" },
      { name: "Lenovo Legion 5", price: "₹65,990", rating: "4.3/5", features: "Ryzen 5, GTX 1650, 8GB RAM, good build quality" }
    ];
  } else if (isPhoneQuery) {
    productType = "smartphones";
    recommendations = [
      { name: "Samsung Galaxy S23 Ultra", price: "₹1,24,999", rating: "4.6/5", features: "200MP camera, S Pen, 5000mAh battery, Snapdragon 8 Gen 2" },
      { name: "OnePlus 11", price: "₹56,999", rating: "4.5/5", features: "50MP camera, 100W charging, Snapdragon 8 Gen 2, smooth performance" },
      { name: "Google Pixel 7 Pro", price: "₹59,999", rating: "4.4/5", features: "Tensor G2, excellent camera, pure Android, 3 years updates" }
    ];
  } else {
    // Generic electronics response
    recommendations = [
      { name: "Premium Product A", price: "₹24,990", rating: "4.6/5", features: "High quality, great features, excellent value" },
      { name: "Best Value Product B", price: "₹18,900", rating: "4.4/5", features: "Balanced features, good performance, reliable" },
      { name: "Budget Option C", price: "₹12,999", rating: "4.2/5", features: "Essential features, decent quality, affordable" }
    ];
  }

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

  if (isHeadphonesQuery) {
    return [
      {
        title: "Sony WH-1000XM5",
        price: "₹29,990",
        rating: "4.6/5",
        features: ["Industry-leading ANC", "30hr battery", "premium build"],
        isRecommended: false
      },
      {
        title: "Bose QuietComfort 45",
        price: "₹18,900",
        rating: "4.4/5",
        features: ["Excellent noise cancellation", "comfortable fit", "good battery life"],
        isRecommended: true
      },
      {
        title: "JBL Live 700BTNC",
        price: "₹12,999",
        rating: "4.2/5",
        features: ["Good ANC for price", "wireless charging", "JBL sound quality"],
        isRecommended: false
      }
    ];
  } else if (isLaptopQuery) {
    return [
      {
        title: "ASUS ROG Strix G15",
        price: "₹89,990",
        rating: "4.7/5",
        features: ["RTX 4060 GPU", "Ryzen 7 processor", "16GB RAM"],
        isRecommended: false
      },
      {
        title: "Dell G5 15",
        price: "₹72,990",
        rating: "4.4/5",
        features: ["i7 processor", "GTX 1650", "8GB RAM"],
        isRecommended: true
      },
      {
        title: "Lenovo Legion 5",
        price: "₹65,990",
        rating: "4.3/5",
        features: ["Ryzen 5", "GTX 1650", "good build quality"],
        isRecommended: false
      }
    ];
  } else if (isPhoneQuery) {
    return [
      {
        title: "Samsung Galaxy S23 Ultra",
        price: "₹1,24,999",
        rating: "4.6/5",
        features: ["200MP camera", "S Pen", "Snapdragon 8 Gen 2"],
        isRecommended: false
      },
      {
        title: "OnePlus 11",
        price: "₹56,999",
        rating: "4.5/5",
        features: ["50MP camera", "100W charging", "smooth performance"],
        isRecommended: true
      },
      {
        title: "Google Pixel 7 Pro",
        price: "₹59,999",
        rating: "4.4/5",
        features: ["Tensor G2", "excellent camera", "pure Android"],
        isRecommended: false
      }
    ];
  } else {
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