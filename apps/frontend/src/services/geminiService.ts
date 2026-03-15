import { SearchParams, AiResponse, ChatMessage } from '../types';
import { storageService } from './storageService';

const API_BASE_URL = '/api';

export const generateContent = async (prompt: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generateContent`, {
    method: 'POST',
    headers: storageService.getAuthHeaders(),
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json();
  return data.text;
};

export const generateFireSafetyReport = async (params: SearchParams): Promise<AiResponse> => {
  const response = await fetch(`${API_BASE_URL}/generateFireSafetyReport`, {
    method: 'POST',
    headers: storageService.getAuthHeaders(),
    body: JSON.stringify({ params }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate report');
  }
  
  return response.json();
};

export const createChatSession = async (reportContext: string): Promise<any> => {
    // This will be handled differently now, the frontend won't create a session object.
    // We can just return a dummy object for now.
    return Promise.resolve({ reportContext });
};

export const createGeneralAssistantSession = async (): Promise<any> => {
    // Return a mock object that mimics the Chat interface
    return Promise.resolve({
        sendMessage: async (msg: string | { message: string }) => {
            return {
                text: "I am a mock assistant. The real AI service is currently being updated."
            };
        }
    });
};

export const sendMessage = async (message: string, history: ChatMessage[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/sendMessage`, {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify({ message, history }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
    }
    
    const data = await response.json();
    return data.text;
}

export const generateNTC = async (params: SearchParams, violations: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/generateNTC`, {
        method: 'POST',
        headers: storageService.getAuthHeaders(),
        body: JSON.stringify({ params, violations }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate NTC');
    }

    const data = await response.json();
    return data.text;
}

export const analyzeTrainingDocument = async (input: string | { data: string, mimeType: string }): Promise<any[]> => {
    // This function is not used in the UI, so we can leave it as a placeholder
    return Promise.resolve([]);
}