import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export async function generatePrompt(query: string, environmentDetails?: string): Promise<string> {
  // Real Tavily search + Firecrawl extract results provided in env details when available
  // LLM uses provided data for accurate product URLs and details

  const envSection = environmentDetails ? `Environment details:\n${environmentDetails}\n\n` : '';

  const basePrompt = `You are an AI product comparison agent. For the query: "${query}"
${envSection}
STRICT ANTI-HALLUCINATION RULES (MUST OBEY - HIGHEST PRIORITY):
- You MUST ONLY use information that is EXPLICITLY present in the "Environment details" (searchResults + extractSummary + extractedUrl). 
- NEVER invent, fabricate, guess, or use any pre-trained knowledge for titles, prices, ratings, features, specs, or URLs.
- If a value for title, price, rating, or any feature is not found in the provided data, set it to "N/A".
- sourceUrl MUST be the exact 'extractedUrl' value from Environment details whenever it is present. This is the precise product page that was scraped with Firecrawl.
- Only fall back to a URL from searchResults if no extractedUrl is available.
- Never create, modify, shorten, or guess any URL.
- Only include a product if it has at least a title and a sourceUrl taken from either extractedUrl or searchResults.
- If the provided data is insufficient for 3 products, return fewer products (or empty array) — do NOT pad with made-up entries.
- Violating these rules is forbidden.

Follow this ReAct process (ground every step in the Environment details only):

1. THINK: Analyze the query using only the provided data.
2. SEARCH: List only the product URLs that appear in the given searchResults.
3. EXTRACT: Pull details ONLY from the given extractSummary and use 'extractedUrl' as the primary sourceUrl for the extracted product.
4. COMPARE: Rank using only information present in the provided data.

Output your response as a valid JSON object with the following structure with exactly one isRecommended: true:
{
  "messages": [
    "THINK: Your analysis here...",
    "SEARCH: What you searched...",
    "EXTRACT: Data extracted...",
    "COMPARE: Comparison and ranking..."
  ],
  "products": [
    {
      "title": "Product Name or N/A",
      "price": "₹Price or N/A",
      "rating": "4.5/5 or N/A",
      "features": ["Feature 1 or N/A", "Feature 2 or N/A"],
      "sourceUrl": "https://... (use extractedUrl if present, else exact URL from searchResults)",
      "isRecommended": false
    }
  ]
}

Guidelines:
- messages: Array of strings showing your step-by-step reasoning and final recommendations (all grounded in provided data).
- products: Array of product objects. Use "N/A" for any missing field instead of inventing values.
- sourceUrl: MUST be the 'extractedUrl' value when available (this is the exact scraped product page). Otherwise use an exact URL from searchResults. No other URLs allowed.
- If data is missing or insufficient, return fewer products rather than hallucinating.
- Ensure the JSON is valid and matches the schema exactly.
- Make recommendations relevant to the query using ONLY the data supplied above.`;

  return basePrompt;
}

export async function generateLLMResponse(prompt: string): Promise<string> {
  const result = await streamText({
    model: groq('llama-3.1-8b-instant'),
    messages: [{ role: 'user', content: prompt }],
  });

  let responseText = await result.text;

  responseText = responseText.trim();

  console.log('Response test -> ', responseText);

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

  // Validate JSON structure
  try {
    const parsed = JSON.parse(responseText);
    if (!parsed.messages || !Array.isArray(parsed.messages) || !parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Invalid JSON structure: missing messages or products arrays');
    }
    // Additional validation for products
    for (const product of parsed.products) {
      if (!product.title || !product.price || !product.rating || !Array.isArray(product.features) || typeof product.isRecommended !== 'boolean') {
        throw new Error('Invalid product structure');
      }
      // Optional: ensure sourceUrl is a valid product URL if present
      if (product.sourceUrl !== undefined) {
        if (typeof product.sourceUrl !== 'string') {
          throw new Error('Invalid product structure: sourceUrl must be a string');
        }
        // Ensure it's a full product URL, not just domain
        if (!product.sourceUrl.includes('/dp/') && !product.sourceUrl.includes('/p/itm') && !product.sourceUrl.includes('/product/')) {
          throw new Error('Invalid product structure: sourceUrl must be a full product URL');
        }
      }
    }
  } catch (error) {
    console.error('JSON validation failed:', error);
    responseText = JSON.stringify({
      messages: ['Error: Failed to generate valid response'],
      products: []
    });
  }

  return responseText;
}
