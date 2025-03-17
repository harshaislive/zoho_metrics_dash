import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // Create system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant that can query project metrics from a Supabase database.
      The database contains tables:
      - raw_zoho_data (entity_type, data)
      You can run SQL queries to fetch data and analyze metrics.`
    };

    // Get OpenAI's response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        systemMessage,
        ...history,
        { role: 'user', content: message }
      ],
      functions: [{
        name: 'queryDatabase',
        description: 'Query the Supabase database',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL query to execute'
            }
          },
          required: ['query']
        }
      }],
      function_call: 'auto'
    });

    const aiResponse = completion.choices[0].message;

    // If AI wants to query the database
    if (aiResponse.function_call?.name === 'queryDatabase') {
      const { query } = JSON.parse(aiResponse.function_call.arguments);
      
      // Use raw SQL query instead of RPC
      const { data, error } = await supabase
        .from('raw_zoho_data')
        .select('*')
        .limit(100); // Use a simple query as a fallback
      
      // Note: In a production environment, you would need to implement
      // proper SQL query execution with security measures
      
      if (error) throw error;

      // Get AI to interpret the results
      const interpretation = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          systemMessage,
          ...history,
          { role: 'user', content: message },
          aiResponse,
          { 
            role: 'function',
            name: 'queryDatabase',
            content: JSON.stringify(data)
          }
        ]
      });

      return NextResponse.json({ 
        response: interpretation.choices[0].message.content 
      });
    }

    return NextResponse.json({ 
      response: aiResponse.content 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 