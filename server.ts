import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { FIRE_CODE_CONTEXT } from './constants.ts';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('Starting server initialization...');

async function createServer() {
  try {
    const app = express();
    const PORT = parseInt(process.env.PORT || '3000', 10);
    console.log(`Configured PORT: ${PORT}`);

    app.use(cors());

    // PostgreSQL Connection
    let dbPool: pg.Pool | null = null;
    if (process.env.DATABASE_URL) {
      try {
        dbPool = new pg.Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        console.log('PostgreSQL connection pool initialized');
      } catch (err) {
        console.error('Failed to initialize PostgreSQL pool:', err);
      }
    } else {
      console.warn('DATABASE_URL not set. PostgreSQL features disabled.');
    }

    // PayMongo Webhook
    app.post('/api/paymongo/webhook', express.raw({ type: 'application/json' }), (req, res) => {
      // ... (rest of the webhook code remains the same)
      const signatureHeader = req.headers['paymongo-signature'];
      const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('PAYMONGO_WEBHOOK_SECRET is not set');
        return res.status(500).send('Server configuration error');
      }

      if (!signatureHeader) {
        return res.status(400).send('Missing signature');
      }

      try {
        const sigString = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
        const parts = sigString.split(',');
        const timestampPart = parts.find(p => p.startsWith('t='));
        const testSigPart = parts.find(p => p.startsWith('te='));
        const liveSigPart = parts.find(p => p.startsWith('li='));

        if (!timestampPart || (!testSigPart && !liveSigPart)) {
          throw new Error('Invalid signature format');
        }

        const timestamp = timestampPart.substring(2);
        const signature = (process.env.NODE_ENV === 'production' && liveSigPart) 
          ? liveSigPart.substring(3) 
          : (testSigPart ? testSigPart.substring(3) : '');

        if (!signature) {
          throw new Error('Signature not found');
        }

        const payload = `${timestamp}.${req.body.toString()}`;
        const computedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payload)
          .digest('hex');

        if (computedSignature !== signature) {
          throw new Error('Invalid signature');
        }

        const event = JSON.parse(req.body.toString());
        const eventType = event.data.attributes.type;

        console.log(`Received PayMongo Event: ${eventType}`);

        if (eventType === 'checkout_session.payment.paid') {
          const checkoutSessionId = event.data.attributes.data.id;
          console.log(`Payment successful for session: ${checkoutSessionId}`);
          // Fulfill order logic here
        }

        res.status(200).send('Webhook received');
      } catch (error: any) {
        console.error('PayMongo Webhook Error:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    });

    app.use(express.json());

    // Health Check
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        env: process.env.NODE_ENV,
        db: !!dbPool,
        ai: !!process.env.GEMINI_API_KEY
      });
    });

    // PayMongo Checkout Session
    app.post('/api/paymongo/create-checkout', async (req, res) => {
      console.log('Received request to /api/paymongo/create-checkout');
      try {
        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (!secretKey) {
          console.error('PAYMONGO_SECRET_KEY is missing');
          return res.status(500).json({ error: 'Payment configuration error' });
        }

        const encodedKey = Buffer.from(secretKey).toString('base64');
        const origin = req.headers.origin || 'https://www.superfcai.tech';
        console.log(`Creating checkout session for origin: ${origin}`);

        const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${encodedKey}`,
          },
          body: JSON.stringify({
            data: {
              attributes: {
                line_items: [
                  {
                    currency: 'PHP',
                    amount: 19900, // 199.00 PHP in centavos
                    description: 'Super FC AI Pro Subscription',
                    name: 'Pro Plan',
                    quantity: 1,
                  },
                ],
                payment_method_types: ['card', 'gcash', 'paymaya', 'grab_pay'],
                success_url: `${origin}/?success=true`,
                cancel_url: `${origin}/?canceled=true`,
                description: 'Super FC AI Pro Subscription',
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
              },
            },
          }),
        });

        const data = await response.json();
        console.log('PayMongo API Response Status:', response.status);

        if (data.errors) {
          console.error('PayMongo API Error:', JSON.stringify(data.errors));
          return res.status(400).json({ error: data.errors[0].detail });
        }

        const checkoutUrl = data.data.attributes.checkout_url;
        console.log('Checkout URL created:', checkoutUrl);
        res.json({ url: checkoutUrl });
      } catch (error: any) {
        console.error('PayMongo Error:', error);
        res.status(500).json({ error: 'Failed to create PayMongo checkout session' });
      }
    });

    // Initialize Google Gen AI client
    let aiClient: GoogleGenAI | null = null;
    try {
      if (process.env.GEMINI_API_KEY) {
        aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log('Google Gen AI initialized successfully');
      } else {
        console.warn('GEMINI_API_KEY missing. AI features will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize Google Gen AI:', error);
    }

    // Using Flash model for better performance and stability in this environment
    // while maintaining high accuracy via the provided context.
    const MODEL_NAME = 'gemini-2.5-flash-preview'; 

    app.post('/api/generateContent', async (req, res) => {
      try {
        if (!aiClient) {
          return res.status(503).json({ error: 'AI service not configured' });
        }
        const { prompt } = req.body;
        const response = await aiClient.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
        });
        res.json({ text: response.text || "No response generated." });
      } catch (error) {
        console.error("Gen AI Error:", error);
        res.status(500).json({ error: 'Failed to generate content' });
      }
    });

    app.post('/api/generateFireSafetyReport', async (req, res) => {
        console.log('Received request to /api/generateFireSafetyReport');
        try {
            if (!aiClient) {
              console.error('AI Client is not initialized');
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { params } = req.body;
            console.log('Generating report for:', JSON.stringify(params));
            
            const getKnowledgeContext = () => ''; // Simplified for now
            const knowledgeContext = getKnowledgeContext();

            const systemInstruction = `
Role:
You are Super FC AI, an intelligent Fire Code reference and inspection assistant for the Bureau of Fire Protection (BFP).

Primary Function:
Analyze the provided Fire Code context (based on RA 9514 and its RIRR) and return accurate, structured, and inspection-ready information based on the user's establishment details.

Context (Your Memory Base):
${FIRE_CODE_CONTEXT}

${knowledgeContext}

Response Behavior:
1.  **Establishment Overview**: Classify the occupancy based on the input.
2.  **Fire Safety Requirements**: List specific requirements (Egress, Alarms, Sprinklers) based on the size, number of stories, and type provided. Cite specific sections from the Context if available.
3.  **Inspection Checklist**: Provide a bulleted list of items an inspector should check physically.
4.  **Legal Basis**: Cite the specific Section/Rule numbers found in the context.
5.  **Notes for Inspector**: Practical reminders or common deficiencies for this specific type.

Constraint:
- Use ONLY the provided context as the source of truth.
- If information is not found in the context for a specific query, state "No direct reference found in the uploaded files."
- Use Markdown for formatting.
- Be professional and direct.
`;

            const userPrompt = `
Generate a Fire Safety Inspection Report for:
- Type of Establishment: ${params.establishmentType}
- Measurement: ${params.area} SQM
- Number of Stories: ${params.stories}
`;
            
            console.log('Sending request to Gemini API...');
            const response = await aiClient.models.generateContent({
              model: MODEL_NAME,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
              },
              contents: userPrompt
            });
            
            console.log('Gemini API Response received');
            res.json({ markdown: response.text || "No response generated." });
        } catch (error) {
            console.error("Gen AI Error in generateFireSafetyReport:", error);
            res.status(500).json({ error: 'Failed to generate fire safety report' });
        }
    });

    app.post('/api/createChatSession', async (req, res) => {
        try {
            if (!aiClient) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            // In the new SDK, chat state is managed by the client or by maintaining history.
            // Since this is a stateless API, we just acknowledge.
            // Real chat history management would happen in /api/sendMessage
            res.json({ message: 'Chat session ready' });

        } catch (error) {
            console.error("Gen AI Error:", error);
            res.status(500).json({ error: 'Failed to create chat session' });
        }
    });

    app.post('/api/sendMessage', async (req, res) => {
        try {
            if (!aiClient) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { message, history } = req.body;
            
            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Map history to Google Gen AI format
            const historyContent = (history || []).map((msg: any) => ({
              role: msg.role,
              parts: [{ text: msg.text }]
            }));
            
            const chat = aiClient.chats.create({
              model: MODEL_NAME,
              history: historyContent
            });

            const result = await chat.sendMessage({ message });
            res.json({ text: result.text || "I couldn't generate a response." });
        } catch (error: any) {
            console.error("Gen AI Error:", error);
            res.status(500).json({ error: error.message || 'Failed to send message' });
        }
    });

    app.post('/api/generateNTC', async (req, res) => {
        console.log('Received request to /api/generateNTC');
        try {
            if (!aiClient) {
              console.error('AI Client is not initialized');
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { params, violations } = req.body;
            console.log('Generating NTC for violations length:', violations.length);

            const systemInstruction = `
Role:
You are a Fire Safety Inspector's Assistant. Your task is to take a list of observed violations and generate the technical details for a Notice to Comply (NTC).

Context:
- Establishment Type: ${params.establishmentType}
- Area: ${params.area} sqm
- Stories: ${params.stories}
- Reference: RA 9514 (Fire Code of the Philippines)

Task:
For each violation listed, provide:
1. The specific Section/Rule of RA 9514 that is violated.
2. A brief explanation of why it is a violation.
3. The required corrective action.

Format:
Use Markdown. Group by violation.
`;

            const userPrompt = `
Observed Violations:
${violations}

Please generate the NTC details.
`;

            const response = await aiClient.models.generateContent({
              model: MODEL_NAME,
              config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
              },
              contents: userPrompt
            });

            res.json({ text: response.text || "No response generated." });
        } catch (error) {
            console.error("Gen AI Error in generateNTC:", error);
            res.status(500).json({ error: 'Failed to generate NTC' });
        }
    });

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      // Serve static files from the dist directory
      app.use(express.static(path.join(__dirname, 'dist')));

      // Handle SPA routing by serving index.html for all other routes
      app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`PayMongo Key Configured: ${!!process.env.PAYMONGO_SECRET_KEY}`);
      console.log(`PayMongo Webhook Secret Configured: ${!!process.env.PAYMONGO_WEBHOOK_SECRET}`);
      console.log(`Gemini API Key Configured: ${!!process.env.GEMINI_API_KEY}`);
      console.log(`Database URL Configured: ${!!process.env.DATABASE_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

createServer();
