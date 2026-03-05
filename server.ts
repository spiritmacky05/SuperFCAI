import express from 'express';
import cors from 'cors';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import { FIRE_CODE_CONTEXT } from './constants.ts';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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
    `);
    
    // Seed default admin if not exists
    const admin = this.db.prepare('SELECT * FROM users WHERE email = ?').get('admin@bfp.gov.ph');
    if (!admin) {
      this.db.prepare('INSERT INTO users (email, name, role, password) VALUES (?, ?, ?, ?)').run(
        'admin@bfp.gov.ph', 'Super Admin', 'admin', 'admin'
      );
      console.log('Seeded admin@bfp.gov.ph');
    }

    // Seed spiritmacky05@gmail.com as super_admin
    const superAdmin = this.db.prepare('SELECT * FROM users WHERE email = ?').get('spiritmacky05@gmail.com');
    if (!superAdmin) {
       this.db.prepare('INSERT INTO users (email, name, role, password) VALUES (?, ?, ?, ?)').run(
        'spiritmacky05@gmail.com', 'Spirit Macky', 'super_admin', 'admin'
      );
      console.log('Seeded spiritmacky05@gmail.com');
    } else {
       this.db.prepare('UPDATE users SET role = ? WHERE email = ?').run('super_admin', 'spiritmacky05@gmail.com');
       console.log('Updated spiritmacky05@gmail.com role');
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

// Postgres Implementation
class PostgresDB implements DB {
  private pool: pg.Pool;
  constructor(connectionString: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    // Check DATABASE_SSL env var first, otherwise default to production/remote logic
    const useSSL = process.env.DATABASE_SSL !== undefined 
      ? process.env.DATABASE_SSL === 'true'
      : (isProduction || connectionString.includes('sslmode=require') || !connectionString.includes('localhost'));
    
    this.pool = new pg.Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false
    });
  }

  async init() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          name TEXT,
          role TEXT,
          password TEXT
        );
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          email TEXT,
          timestamp BIGINT,
          params TEXT,
          result TEXT
        );
        CREATE TABLE IF NOT EXISTS knowledge (
          id TEXT PRIMARY KEY,
          timestamp BIGINT,
          title TEXT,
          content TEXT,
          category TEXT
        );
      `);
      
      // Seed default admin
      const res = await this.pool.query('SELECT * FROM users WHERE email = $1', ['admin@bfp.gov.ph']);
      if (res.rows.length === 0) {
        await this.pool.query('INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4)',
          ['admin@bfp.gov.ph', 'Super Admin', 'admin', 'admin']
        );
        console.log('Seeded admin@bfp.gov.ph');
      }

      // Seed spiritmacky05@gmail.com as super_admin
      const resSuper = await this.pool.query('SELECT * FROM users WHERE email = $1', ['spiritmacky05@gmail.com']);
      if (resSuper.rows.length === 0) {
         await this.pool.query('INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4)',
          ['spiritmacky05@gmail.com', 'Spirit Macky', 'super_admin', 'admin']
        );
        console.log('Seeded spiritmacky05@gmail.com');
      } else {
         await this.pool.query('UPDATE users SET role = $1 WHERE email = $2', ['super_admin', 'spiritmacky05@gmail.com']);
         console.log('Updated spiritmacky05@gmail.com role');
      }
      console.log('PostgreSQL initialized');
    } catch (err) {
      console.error('Failed to init Postgres:', err);
    }
  }

  async query(sql: string, params: any[] = []) {
    // Convert ? to $1, $2, etc. for Postgres compatibility
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    const res = await this.pool.query(pgSql, params);
    return res.rows;
  }

  async run(sql: string, params: any[] = []) {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    return this.pool.query(pgSql, params);
  }
}

async function createServer() {
  try {
    const app = express();
    const PORT = parseInt(process.env.PORT || '3000', 10);
    console.log(`Configured PORT: ${PORT}`);

    const httpServer = http.createServer(app);

    app.use(cors());
    app.use(express.json());

    // Database Connection
    let db: DB;
    if (process.env.DATABASE_URL) {
      console.log('Using PostgreSQL database');
      db = new PostgresDB(process.env.DATABASE_URL);
    } else {
      console.log('Using SQLite database (local)');
      db = new SQLiteDB();
    }
    
    // Initialize DB (create tables, seed data)
    await db.init();

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
      const { email, name, role, password } = req.body;
      try {
        const existing = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
          // Update
          await db.run('UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), password = COALESCE(?, password) WHERE email = ?', 
            [name, role, password, email]);
        } else {
          // Insert
          await db.run('INSERT INTO users (email, name, role, password) VALUES (?, ?, ?, ?)', 
            [email, name, role || 'free', password]);
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
          console.log(`Login successful for: ${email}`);
          const user = { ...users[0] };
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
      const { role } = req.body;
      const { email } = req.params;
      try {
        await db.run('UPDATE users SET role = ? WHERE email = ?', [role, email]);
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
        ai: !!process.env.OPENAI_API_KEY
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

    // Initialize OpenAI client
    let openai: OpenAI | null = null;
    try {
      if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('OpenAI initialized successfully');
      } else {
        console.warn('OPENAI_API_KEY missing. AI features will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
    }

    const MODEL_NAME = 'gpt-5.1'; 

    app.post('/api/generateContent', async (req, res) => {
      try {
        if (!openai) {
          return res.status(503).json({ error: 'AI service not configured' });
        }
        const { prompt } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "user", content: prompt }
            ],
        });
        
        const text = completion.choices[0]?.message?.content || "No response generated.";
        res.json({ text });
      } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: 'Failed to generate content' });
      }
    });

    app.post('/api/generateFireSafetyReport', async (req, res) => {
        console.log('Received request to /api/generateFireSafetyReport');
        try {
            if (!openai) {
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
            
            console.log('Sending request to OpenAI API...');
            
            const completion = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
            });

            const markdown = completion.choices[0]?.message?.content || "No response generated.";
            
            console.log('OpenAI API Response received');
            res.json({ markdown });
        } catch (error) {
            console.error("OpenAI Error in generateFireSafetyReport:", error);
            res.status(500).json({ error: 'Failed to generate fire safety report' });
        }
    });

    app.post('/api/createChatSession', async (req, res) => {
        try {
            if (!openai) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            res.json({ message: 'Chat session ready' });

        } catch (error) {
            console.error("OpenAI Error:", error);
            res.status(500).json({ error: 'Failed to create chat session' });
        }
    });

    app.post('/api/sendMessage', async (req, res) => {
        try {
            if (!openai) {
              return res.status(503).json({ error: 'AI service not configured' });
            }
            const { message, history } = req.body;
            
            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Map history to OpenAI format
            const messages = (history || []).map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.text
            }));
            
            // Add current message
            messages.push({ role: "user", content: message });

            const completion = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: messages,
            });

            const text = completion.choices[0]?.message?.content || "I couldn't generate a response.";
            res.json({ text });
        } catch (error: any) {
            console.error("OpenAI Error:", error);
            res.status(500).json({ error: error.message || 'Failed to send message' });
        }
    });

    app.post('/api/generateNTC', async (req, res) => {
        console.log('Received request to /api/generateNTC');
        try {
            if (!openai) {
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
- For each violation listed, provide:
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

            const completion = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ],
            });

            const text = completion.choices[0]?.message?.content || "No response generated.";

            res.json({ text });
        } catch (error) {
            console.error("OpenAI Error in generateNTC:", error);
            res.status(500).json({ error: 'Failed to generate NTC' });
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
      console.log(`OpenAI API Key Configured: ${!!process.env.OPENAI_API_KEY}`);
      console.log(`Database URL Configured: ${!!process.env.DATABASE_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

createServer();
