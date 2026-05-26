import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { generatePrompt } from '@/lib/chat/prompts';
import { generateDemoResponse, parseDemoProducts } from '@/lib/chat/responses';
import { hasValidApiKeys } from '@/lib/chat/utils';
import { searchWithTavily, extractWithFirecrawl } from '@/lib/chat/tools';
import type { MessagePart } from '@/lib/types/chat';

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: { content?: string; parts?: MessagePart[] }[] } = await request.json();
    const lastMessage = messages[messages.length - 1];
    const fullText = lastMessage?.content || lastMessage?.parts?.find((part: MessagePart) => part.type === 'text')?.text;

    console.log('messages-',messages)
    if (!fullText) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Parse format from the message
    const formatMatch = fullText.match(/^FORMAT: (\w+)/);
    const format = formatMatch ? formatMatch[1] as 'text' | 'ui' : 'text';
    const userMessage = fullText.replace(/^FORMAT: \w+\n/, '').trim();

    // Check if we have API keys for full functionality
    const { hasGroq, hasTavily, hasFirecrawl } = hasValidApiKeys();

    let responseText: string;

    if (!hasGroq) {
      // Demo response when no API keys are configured
      const demoText = generateDemoResponse(userMessage);
      const products = parseDemoProducts(userMessage);
      const messages = demoText.split('\n').filter(line => line.trim());
      responseText = JSON.stringify({ messages, products });
    } else {
      // Full AI implementation with real tools
      console.log('userMessage-',userMessage)
      let searchResults: any[] = [];
      if (hasTavily) {
        try {
          const raw = await searchWithTavily(userMessage, 5);
          searchResults = raw.map(r => ({ title: r.title, url: r.url, snippet: (r.content || '').slice(0, 200) }));
        } catch (e) { console.error('Tavily search failed:', e); }
      }

      // Extract from up to 2 best product detail pages (token budget)
      let extractedPages: Array<{ url: string; summary: string }> = [];
      if (hasFirecrawl && searchResults.length > 0) {
        const topProductUrls = searchResults
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((r: any) => r.url && (r.url.includes('/dp/') || r.url.includes('/p/itm') || r.url.includes('/product/')))
          .slice(0, 2);

        if (topProductUrls.length > 0) {
          const results = await Promise.allSettled(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            topProductUrls.map(async (r: any) => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: any = await extractWithFirecrawl(r.url);
                const summary = (data.markdown || data.html || '').slice(0, 3000); // reduced for token limit
                const canonical = data?.metadata?.sourceURL || data?.metadata?.url || r.url;
                return { url: canonical, summary };
              } catch (e) {
                console.error('Firecrawl extract failed for', r.url, e);
                return null;
              }
            })
          );
          extractedPages = results
            .filter((p): p is PromiseFulfilledResult<{ url: string; summary: string }> => p.status === 'fulfilled' && !!p.value)
            .map(p => p.value);
        }
      }

      console.log('Extracted pages count:', extractedPages.length);

      const environment = {
        searchResults: searchResults.map(r => ({ title: r.title, url: r.url })).slice(0, 5),
        extractedPages  // max 2 pages × ~1100 chars each + URLs
      };

      const prompt = await generatePrompt(userMessage, JSON.stringify(environment));
      console.log('Prompt-',prompt)
      const result = await streamText({
        model: groq('llama-3.1-8b-instant'),
        messages: [{ role: 'user', content: prompt }],
      });
      let rawResponse = await result.text;

      // Clean up and validate JSON
      rawResponse = rawResponse.trim();
      if (rawResponse.startsWith('```json')) {
        rawResponse = rawResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (rawResponse.startsWith('```')) {
        rawResponse = rawResponse.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
      }
      const startIndex = rawResponse.indexOf('{');
      const lastIndex = rawResponse.lastIndexOf('}');
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        rawResponse = rawResponse.substring(startIndex, lastIndex + 1);
      }

      try {
        const parsed = JSON.parse(rawResponse);
        if (!parsed.messages || !Array.isArray(parsed.messages) || !parsed.products || !Array.isArray(parsed.products)) {
          throw new Error('Invalid structure');
        }
        responseText = rawResponse;
      } catch (error) {
        console.error('AI response validation failed:', error);
        responseText = JSON.stringify({
          messages: ['Error: Failed to generate valid response'],
          products: []
        });
      }
    }

    // Convert text to data stream for consistent handling
    const messageId = `msg_${Date.now()}`;
    const dataStream = new ReadableStream({
      start(controller) {
        // Send start event
        controller.enqueue(`data: ${JSON.stringify({ type: 'text-start', id: messageId })}\n\n`);
        // Send the full response as a single delta
        controller.enqueue(`data: ${JSON.stringify({ type: 'text-delta', id: messageId, delta: responseText })}\n\n`);
        // Send end event
        controller.enqueue(`data: ${JSON.stringify({ type: 'text-end', id: messageId })}\n\n`);
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
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





