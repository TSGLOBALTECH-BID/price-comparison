import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export async function generatePrompt(query: string, environmentDetails?: string): Promise<string> {
  // Compact prompt + small environment (max 2 short extracts) to stay under Groq 6k TPM on llama-3.1-8b-instant.

  const envSection = environmentDetails ? `Environment details:\n${environmentDetails}\n\n` : '';

  const basePrompt = `You are a product recommendation agent. Query: "${query}"

${envSection}

CRITICAL RULE (highest priority):
- sourceUrl MUST be copied EXACTLY (character for character) from searchResults[].url or extractedPages[].url only.
- Never shorten, rewrite, or invent any URL. If no exact match, omit the product or set "sourceUrl":"N/A".
- Use ONLY data from the Environment details. No external knowledge.

Output ONLY this exact JSON (one isRecommended:true):
{
  "messages": ["THINK: ...", "SEARCH: ...", "EXTRACT: ...", "RECOMMEND: ..."],
  "products": [{
    "title": "name or N/A",
    "price": "₹x or N/A",
    "rating": "x/5 or N/A",
    "features": ["f1 or N/A"],
    "sourceUrl": "EXACT url from provided data",
    "isRecommended": false
  }]
}

Rules: Max 3 products. Only include products with real title + exact sourceUrl from the data.`;



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
      // sourceUrl is now REQUIRED and must be a real product URL
      if (!product.sourceUrl || typeof product.sourceUrl !== 'string' || product.sourceUrl === 'N/A') {
        throw new Error('Invalid product structure: sourceUrl is required and must be a valid URL');
      }
      // Ensure it's a full product URL from supported sites (amazon.in, flipkart, etc.)
      if (!product.sourceUrl.includes('/dp/') && !product.sourceUrl.includes('/p/itm') && !product.sourceUrl.includes('/product/')) {
        throw new Error('Invalid product structure: sourceUrl must be a full product URL');
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
