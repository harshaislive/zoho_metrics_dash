import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define the route handler
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

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
      // Parse the function arguments but don't use the query for now
      JSON.parse(aiResponse.function_call.arguments);
      
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

      return res.json({ 
        response: interpretation.choices[0].message.content 
      });
    }

    res.json({ 
      response: aiResponse.content 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 