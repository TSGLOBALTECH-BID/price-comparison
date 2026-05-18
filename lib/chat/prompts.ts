import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export async function generatePrompt(query: string, environmentDetails?: string): Promise<string> {
  // Real Tavily search + Firecrawl extract results provided in env details when available
  // LLM uses provided data for accurate product URLs and details

  const envSection = environmentDetails ? `Environment details:\n${environmentDetails}\n\n` : '';

  const basePrompt = `You are an AI product comparison agent. For the query: "${query}"
${envSection}
Follow this ReAct process:

1. THINK: Analyze the query to extract product type, constraints, and preferences.

  2. SEARCH: Use the provided Tavily results for product URLs from Indian e-commerce sites.

  3. EXTRACT: Use the provided Firecrawl data for product details.

4. COMPARE: Rank the products based on preferences.

 
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
      "title": "Product Name",
      "price": "₹Price",
      "rating": "4.5/5",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "sourceUrl": "https://www.amazon.in/dp/B0CHX1K2ZC",
      "isRecommended": false
    },
  ]
}

Guidelines:
- messages: Array of strings showing your step-by-step reasoning and final recommendations.
- products: Array of product objects with recommendations. For text format, this can be empty array if not applicable, but for UI format, populate with relevant products.
- sourceUrl: Provide a valid, realistic product URL from Indian e-commerce sites like amazon.in, flipkart.com, croma.com, or reliance.com. Use actual URL formats (e.g., https://www.amazon.in/product-name/dp/B0XXXXXX, https://www.flipkart.com/product-name/p/itmxxxxx).
- Ensure the JSON is valid and matches the schema exactly.
- Make recommendations relevant to the query and realistic for Indian market.`;

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
