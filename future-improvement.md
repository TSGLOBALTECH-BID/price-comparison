**Yes — this is the best next improvement** to eliminate almost all hallucinations.

### Strong Recommendation

**Use Firecrawl's structured JSON extraction** instead of raw `markdown` + our Groq LLM.

Current Firecrawl SDK (v4+) supports this cleanly:

```ts
// Recommended new approach in tools.ts
const result = await firecrawlApp.scrape(url, {
  formats: [{
    type: 'json',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        price: { type: 'string' },
        rating: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        // ...
      }
    },
    prompt: 'Extract the main product title, current price, rating, and key features from this product page.'
  }],
  onlyMainContent: true
});

const extractedProduct = result.json; // clean structured data
```

### Key Benefits
- Product data comes directly from the page via Firecrawl's specialized extractor (far more reliable than our general Groq model).
- `sourceUrl` will be the real scraped URL.
- You can **skip or heavily reduce** the final Groq call for the `products` array.

### Practical Paths Forward

1. **Best short-term (recommended)**:  
   Change the single Firecrawl call to use `formats: [{type: 'json', schema: ...}]`.  
   Map the result directly into your `products` array.  
   Use Groq **only** for the narrative `messages` (thinking steps) if you still want them — or generate them with simple templates/rules.

2. **For multiple products**:  
   - Extract the top 2–3 Tavily URLs with structured extraction in parallel (instead of just one).  
   - Or scrape one "comparison" page if available.

3. **Hybrid (lowest hallucination risk)**:  
   - Primary product(s) → from Firecrawl JSON extraction (deterministic mapping).  
   - Fallback/additional products → Tavily snippets only (no LLM invention).

4. **Cheaper alternative (no extra credits)**:  
   Keep scraping markdown, then write a lightweight parser (regex + heuristics) for common price/rating patterns on Amazon.in/Flipkart. Less accurate than Firecrawl JSON mode but zero extra LLM cost.

### Important Notes
- Firecrawl's JSON mode still uses **their** LLM under the hood, but it is page-aware and schema-constrained → much safer than our current "throw 500 chars at Groq" approach.
- You will need to update `extractWithFirecrawl` + the data passed to the prompt + the final response mapping in `route.ts`.
- Current design only extracts **one** page. Direct mapping will naturally give you high-quality data for that one product.

This change directly solves the root cause you identified earlier.

Would you like me to implement the structured extraction path (option 1) as the next step?