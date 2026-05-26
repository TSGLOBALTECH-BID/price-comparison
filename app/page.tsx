'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { ProductGrid } from '@/lib/components/ProductGrid';

interface Product {
  title: string;
  price: string;
  rating?: string;
  features?: string[];
  isRecommended?: boolean;
  sourceUrl?: string;
}

interface ResponseData {
  messages: string[];
  products: Product[];
}

export default function Home() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<'text' | 'ui'>('ui');
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const { sendMessage, status, error, stop } = useChat({
    onData: (response) => {
      console.log('Response received:', response);
    },
    onFinish: (message) => {
      console.log('Message finished:', message);
      const content = message.message.parts?.find((part) => 'type' in part && part.type === 'text')?.text;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (parsed.messages && Array.isArray(parsed.messages) && parsed.products && Array.isArray(parsed.products)) {
            setResponseData(parsed);
          } else {
            console.error('Invalid response structure');
          }
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setResponseData(null);
      sendMessage({ text: `FORMAT: ${format}\n${input}` });
      setInput('');
    }
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Best Product Recomodation- AI Agent</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-end items-center mb-4 gap-4">
            <h2 className="text-lg font-semibold">Search(Output) Format</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('text')}
                className={`px-4 py-2 rounded-lg ${format === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Text
              </button>
              <button
                onClick={() => setFormat('ui')}
                className={`px-4 py-2 rounded-lg ${format === 'ui' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                UI
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Best noise-canceling headphones under ₹20k"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Recommend'}
            </button>
            {isLoading && (
              <button
                type="button"
                onClick={stop}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Stop
              </button>
            )}
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Thoughts & Results</h2>

          {error ? (
            <div className="p-4 bg-red-100 text-red-900 rounded-lg">
              <p>Error: {error.message}</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 bg-yellow-100 text-yellow-900 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-900 mr-2"></div>
                {format === 'ui' ? 'Generating best product recommendations...' : 'Agent is thinking and searching...'}
              </div>
            </div>
          ) : responseData ? (
            <>
              {format === 'ui' ? (
                <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                  <h1 className="text-2xl font-bold mb-4">Top Product Recommendations</h1>
                  <ProductGrid props={{ products: responseData.products }} />
                  <p className="mt-4 text-gray-700">
                    {responseData.products.find(p => p.isRecommended)?.title || 'Recommended product'} offers the best balance of features. For premium features, consider other options if needed.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {responseData.messages.map((msg, i) => (
                    <div key={i} className="p-4 bg-gray-100 text-gray-900 rounded-lg whitespace-pre-wrap">
                      {msg}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">Enter a product query to get recommendations...</p>
          )}
        </div>
      </div>
    </div>
  );
}
