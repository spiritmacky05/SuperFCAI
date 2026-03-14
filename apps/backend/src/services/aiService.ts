import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.ts';
import { FIRE_CODE_CONTEXT } from '../fireCodeContext.ts';
import { KnowledgeService } from './knowledgeService.ts';

export class AiService {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  private getClient() {
    if (!env.geminiApiKey) return null;
    return new GoogleGenAI({ apiKey: env.geminiApiKey });
  }

  health() {
    return !!env.geminiApiKey;
  }

  async generateContent(prompt: string) {
    const ai = this.getClient();
    if (!ai) throw new Error('AI service not configured. Missing GEMINI_API_KEY.');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || 'No response generated.';
  }

  async generateFireSafetyReport(params: any) {
    const ai = this.getClient();
    if (!ai) throw new Error('AI service not configured');

    const knowledgeContext = await this.knowledgeService.getKnowledgeContextString();

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: userPrompt,
      config: { systemInstruction },
    });

    return response.text || 'No response generated.';
  }

  async sendMessage(message: string, history: any[]) {
    const ai = this.getClient();
    if (!ai) throw new Error('AI service not configured');

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const knowledgeContext = await this.knowledgeService.getKnowledgeContextString();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [...chatHistory, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are Super FC AI, a helpful assistant for Fire Code queries. 
            
STRICT ZERO-HALLUCINATION RULE:
You must ONLY base your answers on the following training data and context. Do not invent or guess citations. If the answer is not in the context, say "I cannot find this in my training data."

TRAINING DATA:
${FIRE_CODE_CONTEXT}

${knowledgeContext}`,
      },
    });

    return response.text || "I couldn't generate a response.";
  }

  async generateNTC(params: any, violations: string) {
    const ai = this.getClient();
    if (!ai) throw new Error('AI service not configured');

    const knowledgeContext = await this.knowledgeService.getKnowledgeContextString();

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `\nObserved Violations:\n${violations}\n\nPlease generate the NTC details.\n`,
      config: { systemInstruction },
    });

    return response.text || 'No response generated.';
  }
}
