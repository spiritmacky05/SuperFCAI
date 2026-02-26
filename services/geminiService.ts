
import { GoogleGenAI, Chat } from "@google/genai";
import { SearchParams, AiResponse } from '../types';
import { FIRE_CODE_CONTEXT } from '../constants';
import { storageService } from './storageService';

// Initialize the Gemini API client directly using process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getKnowledgeContext = (): string => {
  const entries = storageService.getKnowledge();
  if (entries.length === 0) return "";

  return `
IMPORTANT - USER TRAINING DATA / KNOWLEDGE BASE:
The following are specific provisions, interpretations, or corrections added by the admin. 
YOU MUST PRIORITIZE THIS INFORMATION over general knowledge if it conflicts or adds specificity.
Use these citations where applicable.

${entries.map(e => `[${e.category.toUpperCase()}] ${e.title}: ${e.content}`).join('\n\n')}
`;
};

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateFireSafetyReport = async (params: SearchParams): Promise<AiResponse> => {
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

  try {
    // Using gemini-3-pro-preview for complex reasoning task as per model selection guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual accuracy based on context
      },
    });

    // Access .text property directly as it is a property, not a method
    return {
      markdown: response.text || "No response generated.",
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const createChatSession = (reportContext: string) => {
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

  // Create chat session with appropriate model for conversational reasoning
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const createGeneralAssistantSession = () => {
  const knowledgeContext = getKnowledgeContext();

  const systemInstruction = `
You are Super FC AI, the ultimate expert on Republic Act No. 9514 (Fire Code of the Philippines) and its 2019 Revised Implementing Rules and Regulations (RIRR).

Your goal is to provide highly detailed, authoritative, and structured responses.

Source Knowledge Base:
${FIRE_CODE_CONTEXT}

${knowledgeContext}

STRICT RESPONSE STRUCTURE:
For every inquiry, you must organize your response using these EXACT headers. Use bullet points for detailed sections to make them easier to read.

### 🏷️ TITLE/LABEL
(A concise title for the topic.)

### 📖 EXPLANATION
(Provide a deep technical explanation. **USE BULLET POINTS** to break down the logic, physical requirements, and technical standards. Be extremely detailed.)

### ⚖️ LEGAL BASIS
(Provide accurate citations. **USE BULLET POINTS**. Format: "Section 10.X.X.X para X of the RIRR 2019". Cite multiple sections if they overlap.)

### 💰 PENALTIES
(State the exact PHP amounts of administrative fines from Rule 13. Example: "Failure to provide fire alarm: Php 25,000.00 to Php 37,500.00". Mention possible 'Abatement Orders' or 'Closure'.)

### 🛠️ RECOMMENDATION
(Provide actionable steps for the building owner or inspector to ensure 100% compliance.)

### 💡 ADDITIONAL INSIGHT
(Any other helpful information or common inspection pitfalls.)

IMPORTANT RULES:
- If a citation is not in your context, do not make one up.
- Use professional, authoritative, but helpful language.
- Ensure all numbers and amounts are clear.
`;

  // Use gemini-3-pro-preview for expert assistant tasks requiring high reasoning capabilities
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
    },
  });
};

export const generateNTC = async (params: SearchParams, violations: string): Promise<string> => {
  const systemInstruction = `
Role:
You are Super FC AI, an intelligent Fire Code reference assistant.

Task:
Convert the list of observed violations into a structured Notice to Comply (NTC) detail list.

Context:
${FIRE_CODE_CONTEXT}

Instructions:
1. Output ONLY the list of defects.
2. Follow this strict format for every item:

   ### [Defect Description]
   #### Legal Basis: [Section X.X.X.X (Topic Name)]
   **Explanation:** [Detailed explanation of the requirement and the violation]

   <br>
   <hr>
   <br>

3. EXAMPLE:
   ### Alarm Bell/Horn Not Audible
   #### Legal Basis: Section 10.2.17.3 (Protection - Alarm) and General Inspection Notes (Regular testing of fire alarms)
   **Explanation:** The fire alarm system must be capable of providing an audible signal that is clearly heard throughout the occupied areas to effectively alert occupants in case of a fire emergency. An inaudible alarm bell/horn indicates a failure in the system's functionality.

   <br>
   <hr>
   <br>

4. Use strictly RA 9514 (RIRR 2019) references.
5. IMPORTANT: The "Legal Basis" line must start with "####" so it renders as a header.
`;

  const userPrompt = `
Establishment Details:
- Type: ${params.establishmentType}
- Area: ${params.area} SQM
- Stories: ${params.stories}

Observed Violations/Defects:
${violations}

Generate the detailed NTC list.
`;

  try {
    // Using gemini-3-pro-preview for mapping violations to specific code sections
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    return response.text || "Unable to generate defect list.";
  } catch (error) {
    console.error("Gemini API Error (NTC):", error);
    throw error;
  }
};

export const analyzeTrainingDocument = async (input: string | { data: string, mimeType: string }): Promise<any[]> => {
  const systemInstruction = `
You are an expert Fire Code Data Analyst.
Your task is to extract structured knowledge from the provided document.

Return a JSON ARRAY of objects. Each object must have:
- title: string (The section number or topic title)
- content: string (The detailed provision, rule, or explanation)
- category: one of ["provision", "interpretation", "correction"]

Example Output:
[
  {
    "title": "Section 10.2.5.4",
    "content": "Stairways shall be...",
    "category": "provision"
  }
]

Ensure the content is accurate and preserves the original meaning.
`;

  try {
    let contentPart;
    if (typeof input === 'string') {
      contentPart = { text: input };
    } else {
      contentPart = { inlineData: { data: input.data, mimeType: input.mimeType } };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-12-2025',
      contents: { role: 'user', parts: [contentPart] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
