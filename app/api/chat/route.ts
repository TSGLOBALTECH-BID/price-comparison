import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { generatePrompt } from '@/lib/chat/prompts';
import { generateDemoResponse, parseDemoProducts } from '@/lib/chat/responses';
import { hasValidApiKeys } from '@/lib/chat/utils';
import type { MessagePart } from '@/lib/types/chat';

// Note: tavily and firecrawl clients are initialized in the future full implementation

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: { content?: string; parts?: MessagePart[] }[] } = await request.json();
    const lastMessage = messages[messages.length - 1];
    const fullText = lastMessage?.content || lastMessage?.parts?.find((part: MessagePart) => part.type === 'text')?.text;

    if (!fullText) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // Parse format from the message
    const formatMatch = fullText.match(/^FORMAT: (\w+)/);
    const format = formatMatch ? formatMatch[1] as 'text' | 'ui' : 'text';
    const userMessage = fullText.replace(/^FORMAT: \w+\n/, '').trim();

    // Check if we have API keys for full functionality
    const { hasGroq } = hasValidApiKeys();

    let responseText: string;

    if (!hasGroq) {
      // Demo response when no API keys are configured
      const demoText = generateDemoResponse(userMessage);
      const products = parseDemoProducts(userMessage);
      const messages = demoText.split('\n').filter(line => line.trim());
      responseText = JSON.stringify({ messages, products });
    } else {
      // Full AI implementation
      const prompt = await generatePrompt(userMessage);
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





