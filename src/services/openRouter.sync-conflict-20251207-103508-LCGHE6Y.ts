import type { Model } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

export const openRouterService = {
    async getModels(): Promise<Model[]> {
        try {
            const response = await fetch(`${OPENROUTER_API_URL}/models`);
            const data = await response.json();
            return data.data.map((m: any) => ({
                id: m.id,
                name: m.name,
                description: m.description,
                context_length: m.context_length,
                pricing: m.pricing
            }));
        } catch (error) {
            console.error('Failed to fetch models', error);
            return [];
        }
    },

    async summarizeThread(
        apiKey: string,
        modelId: string,
        threadContent: string,
        sourceType: string
    ): Promise<any> {
        const prompt = `
      You are an expert discussion summarizer. I have a thread from ${sourceType}.
      Your goal is to organize this conversation into a COMPREHENSIVE radial mind-map structure.
      
      CRITICAL INSTRUCTIONS:
      1. Extract AS MANY distinct topics and key viewpoints as possible. Don't be shy, aim for 5-10 topics if the thread is long.
      2. For each topic, extract MULTIPLE specific comments/quotes (children nodes).
      3. Ensure "who said what" is clear.
      4. The structure should feel like a dense, rich web of thoughts, not a sparse summary.
      
      OUTPUT FORMAT:
      Return a JSON object with this structure (do not include markdown formatting like \`\`\`json):
      {
        "topics": [
          { "id": "topic-1", "title": "Main Topic Name", "summary": "Brief summary of this aspect" }
        ],
        "nodes": [
           { 
             "id": "node-1", 
             "topicId": "topic-1", 
             "author": "user1", 
             "content": "Direct quote or detailed summary of their argument.", 
             "sentiment": "insightful",
             "link": "https://..." (if available in text, else null)
           }
        ]
      }

      CONTENT:
      ${threadContent.substring(0, 150000)} // Increased limit for more context
    `;

        const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173', // OpenRouter requires this
                'X-Title': 'Online Thread Summarizer'
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' } // Force JSON if supported, or rely on prompt
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();
        try {
            const content = data.choices[0].message.content;
            return JSON.parse(content);
        } catch (e) {
            throw new Error("Failed to parse LLM response as JSON");
        }
    },
    async chatWithThread(
        apiKey: string,
        model: string,
        threadContent: string,
        question: string,
        currentGraphContext: string
    ): Promise<any> {
        const prompt = `
      You are an intelligent assistant helping a user understand a discussion thread.
      
      CONTEXT:
      The user is viewing a visualization of this thread:
      ${threadContent.substring(0, 50000)}

      CURRENT GRAPH NODES:
      ${currentGraphContext.substring(0, 10000)}

      USER QUESTION:
      "${question}"

      INSTRUCTIONS:
      1. Answer the user's question directly and concisely based on the thread content.
      2. If the user's question reveals a new perspective, detail, or comment that is NOT already in the "CURRENT GRAPH NODES", generate a strictly formatted JSON array of NEW nodes to add.
      3. If no new nodes are needed, return an empty array for nodes.

      OUTPUT FORMAT:
      Return a JSON object:
      {
        "answer": "Your text answer here...",
        "newNodes": [
           { 
             "id": "new-node-unique-id", 
             "topicId": "existing-topic-id-or-null", 
             "author": "user", 
             "content": "quote or summary", 
             "sentiment": "neutral",
             "link": "..." 
           }
        ]
      }
    `;

        const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://thread-weaver.app',
                'X-Title': 'Thread Weaver',
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();
        try {
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error('Failed to parse LLM response', data);
            throw new Error('Failed to parse AI response');
        }
    }
};
