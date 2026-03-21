import express from 'express';
import cors from 'cors';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import { FIRE_CODE_CONTEXT } from './constants.ts';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ override: true });

console.log('Starting server initialization...');

// Database Interface
interface DB {
  query(sql: string, params?: any[]): Promise<any>;
  run(sql: string, params?: any[]): Promise<any>;
  init(): Promise<void>;
}

// SQLite Implementation
class SQLiteDB implements DB {
  private db: any;
  constructor() {
    this.db = new Database('database.sqlite');
  }

  async init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        password TEXT
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        email TEXT,
        timestamp INTEGER,
        params TEXT,
        result TEXT
      );
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        title TEXT,
        content TEXT,
        category TEXT
      );
      CREATE TABLE IF NOT EXISTS error_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        cited_error TEXT,
        actual_correction TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add new columns to users table if they don't exist
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN bfp_id_url TEXT');
    } catch (e) {
      // Column might already exist
    }
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "approved"');
    } catch (e) {
      // Column might already exist
    }
    try {
      this.db.exec('ALTER TABLE users ADD COLUMN bfp_account_number TEXT');
    } catch (e) {
      // Column might already exist
    }
    
    // Seed default admin if not exists
    const admin = this.db.prepare('SELECT * FROM users WHERE email = ?').get('admin@bfp.gov.ph');
    if (!admin) {
      this.db.prepare('INSERT INTO users (email, name, role, password, status) VALUES (?, ?, ?, ?, ?)').run(
        'admin@bfp.gov.ph', 'Super Admin', 'admin', 'admin', 'approved'
      );
      console.log('Seeded admin@bfp.gov.ph');
    }

    // Seed spiritmacky05@gmail.com as super_admin
    const superAdmin = this.db.prepare('SELECT * FROM users WHERE email = ?').get('spiritmacky05@gmail.com');
    if (!superAdmin) {
       this.db.prepare('INSERT INTO users (email, name, role, password, status) VALUES (?, ?, ?, ?, ?)').run(
        'spiritmacky05@gmail.com', 'Spirit Macky', 'super_admin', 'admin', 'approved'
      );
      console.log('Seeded spiritmacky05@gmail.com');
    } else {
       this.db.prepare('UPDATE users SET role = ?, status = ?, password = ? WHERE email = ?').run('super_admin', 'approved', 'admin', 'spiritmacky05@gmail.com');
       console.log('Updated spiritmacky05@gmail.com role, status, and password');
    }
    console.log('SQLite initialized');
  }

  async query(sql: string, params: any[] = []) {
    return this.db.prepare(sql).all(...params);
  }

  async run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}

async function createServer() {
  try {
    const app = express();
    const PORT = 3000;
    console.log(`Configured PORT: ${PORT}`);

    const httpServer = http.createServer(app);

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // Database Connection
    console.log('Using SQLite database (local)');
    let db: DB = new SQLiteDB();
    
    // Initialize DB (create tables, seed data)
    await db.init();

    const getKnowledgeContext = async () => {
      try {
        const entries = await db.query('SELECT * FROM knowledge');
        if (!entries || entries.length === 0) return 'No additional local training data available.';
        return entries.map((e: any) => `--- ${e.title} (${e.category}) ---\n${e.content}`).join('\n\n');
      } catch (e) {
        console.error('Error fetching knowledge context:', e);
        return '';
      }
    };

    // --- API Routes ---

    // Users
    app.get('/api/users', async (req, res) => {
      try {
        const users = await db.query('SELECT * FROM users');
        res.json(users);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/users', async (req, res) => {
      const { email, name, role, password, bfp_id_url, status, bfp_account_number } = req.body;
      try {
        const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
          // Update
          await db.run('UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), password = COALESCE(?, password), bfp_id_url = COALESCE(?, bfp_id_url), status = COALESCE(?, status), bfp_account_number = COALESCE(?, bfp_account_number) WHERE email = ?', 
            [name, role, password, bfp_id_url, status, bfp_account_number, email]);
        } else {
          // Insert
          await db.run('INSERT INTO users (email, name, role, password, bfp_id_url, status, bfp_account_number) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [email, name, role || 'free', password, bfp_id_url || null, status || 'pending', bfp_account_number || null]);
        }
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/login', async (req, res) => {
      const { email, password } = req.body;
      console.log(`Login attempt for: ${email}`);
      try {
        const users = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        if (users.length > 0) {
          const user = { ...users[0] };
          if (user.status === 'pending') {
            console.log(`Login failed (pending approval) for: ${email}`);
            return res.status(403).json({ error: 'Your account is pending approval by an administrator.' });
          }
          console.log(`Login successful for: ${email}`);
          delete user.password;
          res.json(user);
        } else {
          console.log(`Login failed for: ${email}`);
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/api/users/:email', async (req, res) => {
      const { role, status } = req.body;
      const { email } = req.params;
      try {
        await db.run('UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE email = ?', [role, status || 'approved', email]);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/users/:email', async (req, res) => {
      const { email } = req.params;
      try {
        await db.run('DELETE FROM users WHERE email = ?', [email]);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Reports
    app.get('/api/reports', async (req, res) => {
      const { email } = req.query;
      try {
        const reports = await db.query('SELECT * FROM reports WHERE email = ? ORDER BY timestamp DESC', [email]);
        const parsedReports = reports.map((r: any) => ({
          ...r,
          params: JSON.parse(r.params)
        }));
        res.json(parsedReports);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/reports', async (req, res) => {
      const { email, report } = req.body;
      const { id, timestamp, params, result } = report;
      try {
        await db.run('INSERT INTO reports (id, email, timestamp, params, result) VALUES (?, ?, ?, ?, ?)', 
          [id, email, timestamp, JSON.stringify(params), result]
        );
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Knowledge
    app.get('/api/knowledge', async (req, res) => {
      try {
        const entries = await db.query('SELECT * FROM knowledge ORDER BY timestamp DESC');
        res.json(entries);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/knowledge', async (req, res) => {
      const { id, timestamp, title, content, category } = req.body;
      try {
        await db.run('INSERT INTO knowledge (id, timestamp, title, content, category) VALUES (?, ?, ?, ?, ?)', 
          [id, timestamp, title, content, category]
        );
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/knowledge/:id', async (req, res) => {
      const { id } = req.params;
      try {
        await db.run('DELETE FROM knowledge WHERE id = ?', [id]);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // Error Reports
    app.get('/api/error-reports', async (req, res) => {
      try {
        const reports = await db.query('SELECT * FROM error_reports ORDER BY created_at DESC');
        res.json(reports);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/error-reports', async (req, res) => {
      const { user_email, cited_error, actual_correction } = req.body;
      try {
        // Check how many reports the user has submitted today
        const todayReports = await db.query(
          "SELECT COUNT(*) as count FROM error_reports WHERE user_email = ? AND date(created_at) = date('now')",
          [user_email]
        );
        
        if (todayReports[0].count >= 3) {
          return res.status(429).json({ error: 'You have reached the maximum limit of 3 error reports per day.' });
        }

        await db.run('INSERT INTO error_reports (user_email, cited_error, actual_correction) VALUES (?, ?, ?)', 
          [user_email, cited_error, actual_correction]
        );
        
        // Send email notification to user
        try {
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.ethereal.email',
              port: parseInt(process.env.SMTP_PORT || '587'),
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            });
            
            await transporter.sendMail({
              from: '"Super FC AI Admin" <admin@superfcai.tech>',
              to: user_email,
              subject: 'Report Received - Super FC AI',
              text: `Hello,\n\nWe have received your report regarding an AI error.\n\nCited Error: ${cited_error}\n\nWe are evaluating your correction to feed into the AI brain so that next time this error will be corrected.\n\nThank you for helping improve Super FC AI!\n\nBest,\nSuper FC AI Admin Team`
            });
            console.log(`Email sent to ${user_email} for error report.`);
          } else {
            console.log(`Email notification skipped for ${user_email}: SMTP credentials not configured.`);
          }
        } catch (emailErr) {
          console.error('Failed to send email notification:', emailErr);
          // Don't fail the request if email fails
        }

        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.patch('/api/error-reports/:id/status', async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      try {
        await db.run('UPDATE error_reports SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/error-reports/:id', async (req, res) => {
      const { id } = req.params;
      try {
        await db.run('DELETE FROM error_reports WHERE id = ?', [id]);
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

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
        db: !!db,
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
                    amount: 9900, // 99.00 PHP in centavos
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

    // Helper to get AI client
    const getAIClient = () => {
      if (process.env.GEMINI_API_KEY) {
        return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      }
      return null;
    };

    app.post('/api/generateContent', async (req, res) => {
      try {
        const ai = getAIClient();
        if (!ai) {
          return res.status(503).json({ error: 'AI service not configured. Missing GEMINI_API_KEY.' });
        }
        const { prompt } = req.body;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        
        const text = response.text || "No response generated.";
        res.json({ text });
      } catch (error: any) {
        console.error("Gemini Error:", error);
        const errorMessage = error?.message || 'Failed to generate content';
        res.status(500).json({ error: `AI Generation Error: ${errorMessage}` });
      }
    });

    app.post('/api/generateFireSafetyReport', async (req, res) => {
        console.log('Received request to /api/generateFireSafetyReport');
        try {
            const ai = getAIClient();
            if (!ai) {
              console.error('AI Client is not initialized');
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { params } = req.body;
            console.log('Generating report for:', JSON.stringify(params));
            
            const knowledgeContext = await getKnowledgeContext();

            const systemInstruction = `
Role:
You are Super FC AI, an intelligent Fire Code reference and inspection assistant for the Bureau of Fire Protection (BFP).

Primary Function:
Analyze the provided Fire Code context (based on RA 9514 and its RIRR) and return accurate, structured, and inspection-ready information based on the user's establishment details.

Context (Your ONLY Memory Base):
${FIRE_CODE_CONTEXT}

ADDITIONAL TRAINING DATA (HIGH PRIORITY):
${knowledgeContext}

STRICT ZERO-HALLUCINATION RULE:
1. You MUST ONLY use the provided Context and Additional Training Data as your source of truth.
2. If the exact Section, Rule number, or provision is NOT explicitly written in the provided text, you MUST state "Citation not found in training data."
3. DO NOT invent, guess, or assume rule numbers, measurements, or penalties.
4. Quote directly from the text where possible.

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
${params.additional_details ? `- Additional Details: ${params.additional_details}` : ''}
`;
            
            console.log('Sending request to Gemini API...');
            
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction
                }
            });

            const markdown = response.text || "No response generated.";
            
            console.log('Gemini API Response received');
            res.json({ markdown });
        } catch (error: any) {
            console.error("Gemini Error in generateFireSafetyReport:", error);
            const errorMessage = error?.message || 'Failed to generate fire safety report';
            res.status(500).json({ error: `AI Generation Error: ${errorMessage}` });
        }
    });

    app.post('/api/createChatSession', async (req, res) => {
        try {
            const ai = getAIClient();
            if (!ai) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            res.json({ message: 'Chat session ready' });

        } catch (error) {
            console.error("Gemini Error:", error);
            res.status(500).json({ error: 'Failed to create chat session' });
        }
    });

    app.post('/api/sendMessage', async (req, res) => {
        try {
            const ai = getAIClient();
            if (!ai) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { message, history } = req.body;
            
            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Construct chat history for Gemini
            const chatHistory = (history || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const contents = [
                ...chatHistory,
                { role: 'user', parts: [{ text: message }] }
            ];

            const knowledgeContext = await getKnowledgeContext();

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: contents,
                config: {
                    systemInstruction: `You are Super FC AI, a helpful assistant for Fire Code queries. 
            
STRICT ZERO-HALLUCINATION RULE:
You must ONLY base your answers on the following training data and context. Do not invent or guess citations. If the answer is not in the context, say "I cannot find this in my training data."

TRAINING DATA:
${FIRE_CODE_CONTEXT}

${knowledgeContext}`
                }
            });

            const text = response.text || "I couldn't generate a response.";
            
            res.json({ text });
        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMessage = error?.message || 'Failed to send message';
            res.status(500).json({ error: `AI Chat Error: ${errorMessage}` });
        }
    });

    app.post('/api/generateNTC', async (req, res) => {
        console.log('Received request to /api/generateNTC');
        try {
            const ai = getAIClient();
            if (!ai) {
              console.error('AI Client is not initialized');
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { params, violations } = req.body;
            console.log('Generating NTC for violations length:', violations.length);

            const knowledgeContext = await getKnowledgeContext();

            const systemInstruction = `
Role:
You are a Fire Safety Inspector's Assistant. Your task is to take a list of observed violations and generate the technical details for a Notice to Comply (NTC).

Context:
- Establishment Type: ${params.establishmentType}
- Area: ${params.area} sqm
- Stories: ${params.stories}
${params.additional_details ? `- Additional Details: ${params.additional_details}` : ''}
- Reference: RA 9514 (Fire Code of the Philippines)

TRAINING DATA (STRICT SOURCE OF TRUTH):
${FIRE_CODE_CONTEXT}

${knowledgeContext}

STRICT ZERO-HALLUCINATION RULE:
You MUST ONLY use the provided Training Data to find the specific Section/Rule of RA 9514. If the exact violation citation is not found in the text, state "Citation not found in training data" instead of guessing a section number.

Task:
- For each violation listed, provide:
1. The specific Section/Rule of RA 9514 that is violated (ONLY if found in training data).
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

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction
                }
            });

            const text = response.text || "No response generated.";

            res.json({ text });
        } catch (error: any) {
            console.error("Gemini Error in generateNTC:", error);
            const errorMessage = error?.message || 'Failed to generate NTC';
            res.status(500).json({ error: `AI Generation Error: ${errorMessage}` });
        }
    });

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer
          }
        },
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

    httpServer.listen(PORT, '0.0.0.0', () => {
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
