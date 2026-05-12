import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { tavily } from '@tavily/core';
import FirecrawlApp from '@mendable/firecrawl-js';

interface MessagePart {
  type: string;
  text?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, format } = await request.json();
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.parts?.find((part: MessagePart) => part.type === 'text')?.text;

    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Check if UI format is requested
    if (format === 'ui') {
      const uiSpec = await generateUISpec(userMessage);
      return NextResponse.json(uiSpec);
    }

    // Check if we have API keys for full functionality
    const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hasTavily = process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hasFirecrawl = process.env.FIRECRAWL_API_KEY && process.env.FIRECRAWL_API_KEY !== 'your_firecrawl_api_key_here';

    if (!hasGroq) {
      // Demo response when no API keys are configured
      const demoResponse = generateDemoResponse(userMessage);
      return new Response(demoResponse, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Full AI implementation with streaming
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'user',
          content: await generatePrompt(userMessage),
        },
      ],
    });

    // Convert text stream to data stream
    const textStream = result.textStream;
    const messageId = `msg_${Date.now()}`;
    const dataStream = new ReadableStream({
      start(controller) {
        // Send start event
        controller.enqueue(`data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`);
        const reader = textStream.getReader();
        reader.read().then(function process({ done, value }) {
          if (done) {
            controller.enqueue(`data: ${JSON.stringify({ type: 'text-end', id: messageId })}\n\n`);
            controller.enqueue('data: [DONE]\n\n');
            controller.close();
            return;
          }
          controller.enqueue(`data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: value })}\n\n`);
          reader.read().then(process);
        });
      }
    });

    return new Response(dataStream, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generatePrompt(query: string): Promise<string> {
  // For the demo, we'll have the LLM do the reasoning in one go
  // In a full implementation, we'd call tools and stream steps

  return `You are an AI product comparison agent. For the query: "${query}"

Follow this ReAct process:

1. THINK: Analyze the query to extract product type, constraints, and preferences.

2. SEARCH: Use the search tool to find product URLs from Indian e-commerce sites.

3. EXTRACT: Scrape data from those URLs to get product details.

4. COMPARE: Rank the products based on preferences.

Provide a step-by-step response showing your reasoning and final recommendations.

Format the final output as:
- Product 1: Title, Price, Rating, Key Features
- Product 2: ...
- Product 3: ...

Note: This is a simulation - in real implementation, you'd call actual APIs for search and scraping.`;
}

function generateDemoResponse(query: string): string {
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

📊 Data Extraction:
Found ${recommendations.length + 2} relevant product pages, extracting product data...

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

async function generateUISpec(query: string) {
  // Use LLM to generate dynamic product recommendations based on the query
  const prompt = `You are a product comparison expert. For the query: "${query}"

Generate a JSON response with exactly 3 product recommendations. Each product should have:
- title: Product name
- price: Price in ₹ format (realistic Indian prices)
- rating: Rating out of 5 (realistic ratings)
- features: Array of 3 key features
- isRecommended: Boolean (only one product should be recommended)

Format as JSON:
{
  "products": [
    {"title": "...", "price": "₹...", "rating": "...", "features": ["...", "...", "..."], "isRecommended": false},
    {"title": "...", "price": "₹...", "rating": "...", "features": ["...", "...", "..."], "isRecommended": true},
    {"title": "...", "price": "₹...", "rating": "...", "features": ["...", "...", "..."], "isRecommended": false}
  ]
}

Make recommendations relevant to the query and realistic for Indian market.`;

  try {
    const result = await streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: [{ role: 'user', content: prompt }],
    });

    let responseText = await result.text;
    console.log(responseText)

    // Clean up LLM response - extract JSON from various formats
    responseText = responseText.trim();

    // Try to extract JSON from markdown code blocks
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
    }

    // Find JSON object boundaries - look for the first '{' and the last '}'
    const startIndex = responseText.indexOf('{');
    const lastIndex = responseText.lastIndexOf('}');

    if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
      responseText = responseText.substring(startIndex, lastIndex + 1);
    }

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

function parseDemoProducts(query: string = "headphones") {
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

interface Product {
  title: string;
  price: string;
  rating: string;
  features: string[];
  isRecommended: boolean;
}

function createManualUISpec(products: Product[]) {
  return {
    type: "ProductGrid",
    props: { products },
    isDemo: true,
    demoMessage: "⚠️ Live data could not be loaded due to missing API keys. This shows demo product data for demonstration purposes only."
  };
}

interface ProductData {
  title: string;
  price: number;
  rating: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseProductData(markdown: string): ProductData | null {
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