# AI Product Comparison Agent 🛍️🤖

A Next.js-based AI agent that compares products from Indian e-commerce sites using a Modular Agentic Loop architecture.

## 🚀 Features

- **Real-time AI Agent**: Uses ReAct pattern with Groq Llama 3 for reasoning
- **Product Discovery**: Searches Indian e-commerce sites (Amazon, Flipkart, Croma)
- **Data Extraction**: Scrapes product details using Firecrawl
- **Smart Comparison**: Ranks products by price, rating, and features
- **Streaming UI**: Real-time thoughts and results display
- **Free Tier Ready**: Uses free API tiers for development/demo

## 🏗️ Architecture

### Frontend Layer
- Next.js 15 with App Router
- Vercel AI SDK for streaming
- Tailwind CSS for responsive UI

### Orchestrator Layer
- Server Actions with ReAct pattern
- Groq Llama 3 for reasoning
- Tool calling for search/extraction

### Tool Layer
- **Tavily**: Product URL discovery (1k free searches)
- **Firecrawl**: Structured data extraction (500 free credits)
- **Custom Logic**: Data normalization for consistent comparisons

## 🛠️ Setup

1. **Clone & Install**:
   ```bash
   git clone <repo>
   cd price-comparison
   npm install
   ```

2. **Configure API Keys** in `.env.local`:
   ```env
   GROQ_API_KEY=your_groq_key_here
   TAVILY_API_KEY=your_tavily_key_here
   FIRECRAWL_API_KEY=your_firecrawl_key_here
   ```

3. **Run Development**:
   ```bash
   npm run dev
   ```

4. **Test Queries**:
   - "Best noise-canceling headphones under ₹20k"
   - "Top gaming laptops under ₹80k"
   - "Best smartphones with 5G under ₹30k"

## 🎯 Demo Mode

The app works without API keys! It provides simulated responses showing:
- Intent analysis
- Product discovery simulation
- Comparison logic
- Ranked recommendations

## 📊 System Flow

1. **Intent Analysis**: Parse user query for product type, constraints
2. **Product Discovery**: Search e-commerce sites for relevant URLs
3. **Data Extraction**: Scrape product specs (price, rating, features)
4. **Synthesis & Ranking**: Compare and rank products
5. **Streaming Output**: Display results in real-time

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Manual Build
```bash
npm run build
npm start
```

## 📋 API Keys & Free Tiers

| Service | Free Tier | Cost |
|---------|-----------|------|
| Groq | 500k tokens/month | Free |
| Tavily | 1,000 searches/month | Free |
| Firecrawl | 500 credits | Free |
| Vercel | 100GB bandwidth | Free |

## 🧪 Testing

```bash
npm run lint    # Code quality
npm run build   # Production build
npm run dev     # Development server
```

## 🎨 UI Features

- Real-time streaming of agent thoughts
- Responsive design for mobile/desktop
- Error handling and loading states
- Clean product comparison display

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Vercel AI SDK, Groq Llama 3
- **Tools**: Tavily API, Firecrawl API
- **Deployment**: Vercel (free tier)

---

Built with ❤️ using free tools and APIs