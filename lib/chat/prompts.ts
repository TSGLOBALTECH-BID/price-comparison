import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

export async function generatePrompt(query: string): Promise<string> {
  // For the demo, we'll have the LLM do the reasoning in one go
  // In a full implementation, we'd call tools and stream steps
  // Note: This is a simulation - in real implementation, you'd call actual APIs for search and scraping.

  const basePrompt = `You are an AI product comparison agent. For the query: "${query}"

Follow this ReAct process:

1. THINK: Analyze the query to extract product type, constraints, and preferences.

2. SEARCH: Use the search tool to find product URLs from Indian e-commerce sites.

3. EXTRACT: Scrape data from those URLs to get product details.

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
      "isRecommended": false
    },
  ]
}

Guidelines:
- messages: Array of strings showing your step-by-step reasoning and final recommendations.
- products: Array of exactly 3 product objects with recommendations. For text format, this can be empty array if not applicable, but for UI format, populate with relevant products.
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

  // Clean up LLM response - extract JSON from various formats
  responseText = responseText.trim();

  console.log('Response test -> ',responseText);

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
    }
  } catch (error) {
    console.error('JSON validation failed:', error);
    // Return a fallback JSON
    responseText = JSON.stringify({
      messages: ['Error: Failed to generate valid response'],
      products: []
    });
  }

  return responseText;
}