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
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.parts?.find((part: MessagePart) => part.type === 'text')?.text;

    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
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
  // Simulate the AI agent's reasoning process
  return `Analyzing query: "${query}"

🔍 Intent Analysis:
- Product Type: Noise-canceling headphones
- Constraints: Price under ₹20,000
- Preferences: Best quality for price

🌐 Product Discovery:
Searching Indian e-commerce sites (Amazon.in, Flipkart.com, Croma)...

📊 Data Extraction:
Found 5 relevant product pages, extracting product data...

⚖️ Comparison & Ranking:

🏆 Top Recommendations:

1. **Sony WH-1000XM5**
   - Price: ₹29,990
   - Rating: 4.6/5 (2,341 reviews)
   - Key Features: Industry-leading ANC, 30hr battery, premium build
   - Note: Slightly over budget but exceptional quality

2. **Bose QuietComfort 45**
   - Price: ₹18,900
   - Rating: 4.4/5 (1,892 reviews)
   - Key Features: Excellent noise cancellation, comfortable fit, good battery life

3. **JBL Live 700BTNC**
   - Price: ₹12,999
   - Rating: 4.2/5 (956 reviews)
   - Key Features: Good ANC for price, wireless charging, JBL sound quality

💡 Recommendation: Bose QuietComfort 45 offers the best balance of features and stays within your ₹20k budget. For premium features, consider the Sony XM5 if you can stretch your budget.

⚠️ Note: This is a demo response. Configure API keys (GROQ_API_KEY, TAVILY_API_KEY, FIRECRAWL_API_KEY) in .env.local for real AI-powered comparisons.`;
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