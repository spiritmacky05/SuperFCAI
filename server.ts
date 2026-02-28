import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { VertexAI } from '@google-cloud/vertexai';
import { FIRE_CODE_CONTEXT } from './constants.js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function createServer() {
  const app = express();

  app.use(cors());

  // PayMongo Webhook
  app.post('/api/paymongo/webhook', express.raw({ type: 'application/json' }), (req, res) => {
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

  // API routes will go here

  // PayMongo Checkout Session
  app.post('/api/paymongo/create-checkout', async (req, res) => {
    try {
      const secretKey = process.env.PAYMONGO_SECRET_KEY;
      if (!secretKey) {
        return res.status(500).json({ error: 'PayMongo credentials not configured' });
      }

      const encodedKey = Buffer.from(secretKey).toString('base64');
      const origin = req.headers.origin;

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
              payment_method_types: ['gcash'],
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

      if (data.errors) {
        console.error('PayMongo API Error:', data.errors);
        return res.status(400).json({ error: data.errors[0].detail });
      }

      const checkoutUrl = data.data.attributes.checkout_url;
      res.json({ url: checkoutUrl });
    } catch (error: any) {
      console.error('PayMongo Error:', error);
      res.status(500).json({ error: 'Failed to create PayMongo checkout session' });
    }
  });



  // Initialize the Vertex AI client
  const vertex_ai = new VertexAI({
    project: process.env.PROJECT_ID,
    location: process.env.LOCATION,
  });

  const model = 'gemini-1.5-pro-preview-0409';

  const generativeModel = vertex_ai.getGenerativeModel({
      model: model,
  });

  app.post('/api/generateContent', async (req, res) => {
    try {
      const { prompt } = req.body;
      const resp = await generativeModel.generateContent(prompt);
      const response = await resp.response;
      res.json({ text: response.candidates[0].content.parts[0].text || "No response generated." });
    } catch (error) {
      console.error("Vertex AI Error:", error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  });

  app.post('/api/generateFireSafetyReport', async (req, res) => {
      try {
          const { params } = req.body;
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

          const request = {
              contents: [{role: 'user', parts: [{text: userPrompt}]}],
              generationConfig: {
                  temperature: 0.2,
              },
              systemInstruction: {
                  role: 'system',
                  parts: [{text: systemInstruction}]
              }
          };
          const resp = await generativeModel.generateContent(request);
          const response = await resp.response;

          res.json({ markdown: response.candidates[0].content.parts[0].text || "No response generated." });
      } catch (error) {
          console.error("Vertex AI Error:", error);
          res.status(500).json({ error: 'Failed to generate fire safety report' });
      }
  });

  app.post('/api/createChatSession', async (req, res) => {
      try {
          const { reportContext } = req.body;
          const getKnowledgeContext = () => ''; // Simplified for now
          const knowledgeContext = getKnowledgeContext();

          const systemInstruction = `
You are Super FC AI, a helpful Fire Safety assistant. 
The user is viewing a generated inspection report based on RA 9514. 
Answer their follow-up questions specifically about the report or general fire safety rules.
Always refer to the provided context if possible.

CONTEXT REPORT:
${reportContext}

ORIGINAL REFERENCE MATERIAL:
${FIRE_CODE_CONTEXT}

${knowledgeContext}
`;

          const chat = generativeModel.startChat({ 
              systemInstruction: {
                role: 'system',
                parts: [{text: systemInstruction}]
              }
          });

          // We can't serialize the chat object, so we'll handle chat messages in a separate endpoint
          // For now, we'll just send a success message
          res.json({ message: 'Chat session created successfully' });

      } catch (error) {
          console.error("Vertex AI Error:", error);
          res.status(500).json({ error: 'Failed to create chat session' });
      }
  });

  app.post('/api/sendMessage', async (req, res) => {
      try {
          const { message, history } = req.body;
          const chat = generativeModel.startChat({ history });
          const result = await chat.sendMessage(message);
          const response = result.response;
          res.json({ text: response.candidates[0].content.parts[0].text || "I couldn't generate a response." });
      } catch (error) {
          console.error("Vertex AI Error:", error);
          res.status(500).json({ error: 'Failed to send message' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

createServer();
