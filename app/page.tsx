'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, stop } = useChat({
    onData: (response) => {
      console.log('Response received:', response);
    },
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">AI Product Comparison Agent</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              {isLoading ? 'Searching...' : 'Compare'}
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
          {error && (
            <p className="text-red-500 mt-2">{error.message}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Thoughts & Results</h2>

          {messages.length === 0 && !isLoading && (
            <p className="text-gray-500">Enter a product query to start comparison...</p>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
               <div
                 key={message.id}
                 className={`p-4 rounded-lg ${
                   message.role === 'user'
                     ? 'bg-blue-100 text-blue-900'
                     : 'bg-gray-100 text-gray-900'
                 }`}
               >
                 {message.parts && message.parts.length > 0 ? (
                   message.parts.map((part, i) => {
                     if (part.type === 'text') {
                       return <div key={i} className="whitespace-pre-wrap">{part.text}</div>;
                     }
                     return null;
                   })
                 ) : (
                   <div className="whitespace-pre-wrap">{(message as any).content}</div>
                 )}
               </div>
            ))}

            {isLoading && (
              <div className="p-4 bg-yellow-100 text-yellow-900 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-900 mr-2"></div>
                  Agent is thinking and searching...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
