
import { GoogleGenAI, Type } from "@google/genai";

export const getAIChatResponse = async (message: string, language: string = 'English') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `System context: You are the MedEcho Multilingual Assistant. 
      The user is speaking in ${language}. 
      1. Detect if the user is describing symptoms.
      2. Respond in the SAME language (${language}) or the language they used.
      3. Be empathetic and professional. 
      4. Suggest a real doctor for serious issues.
      User says: ${message}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Error connecting to MedEcho. Please check your internet.";
  }
};

export const analyzeSymptoms = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these symptoms and provide a structured JSON diagnosis.
      Symptoms: ${text}
      Format: JSON with keys: condition (string), confidence (number 0-100), symptoms_extracted (array), advice (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            symptoms_extracted: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING }
          },
          required: ["condition", "confidence", "symptoms_extracted", "advice"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

export const getNearbyHospitals = async (lat: number, lng: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the top 3 best hospitals nearby for common ailments.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    return { text: response.text, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
  } catch (error) {
    return null;
  }
};
