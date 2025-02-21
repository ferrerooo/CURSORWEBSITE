import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json() as { messages: ChatMessage[] }
    
    console.log('Sending request with messages:', messages);

    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 800,
    })

    console.log('Received response:', response);

    return new Response(JSON.stringify({
      content: response.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Detailed error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 