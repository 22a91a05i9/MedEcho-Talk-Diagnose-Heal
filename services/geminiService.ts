
import { GoogleGenAI, Type } from "@google/genai";

export const getAIChatResponse = async (message: string, history: string = "") => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `System Instruction: You are the MedEcho Clinical Assistant. 
      
      PHASE 1: INTAKE (Collect Symptoms)
      - Your primary goal is to gather clinical details: symptoms, duration, severity, and triggers.
      - Ask ONLY ONE focused question at a time.
      - Mirror the user's language EXACTLY.
      - Do not provide medical advice or diagnoses in this phase.
      
      PHASE 2: CONCLUSION (Advice & Report)
      - Trigger this phase ONLY when the user indicates they are done (e.g., "no", "that's it") OR you have sufficient basic data.
      - Summarize the reported symptoms briefly.
      - PROVIDE HARMLESS PRECAUTIONS: Offer 2-3 common-sense, safe actions (e.g., "Drink plenty of water", "Get extra rest", "Monitor your temperature", "Keep a symptom log"). 
      - DISCLAIMER: State clearly that you are an AI and they should consult a human doctor.
      - END TRIGGER: You MUST append the exact string "[GENERATING CLINICAL REPORT]" at the very end of your message to signal the system to file the report.

      Conversation History:
      ${history}

      User's New Message: ${message}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Error connecting to MedEcho. Please check your internet connection.";
  }
};

export const analyzeSymptoms = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform the following clinical intake transcript into a professional medical report.
      Transcript: ${text}
      
      Format the output as a JSON object with these keys: 
      - condition: a preliminary clinical observation (e.g., "Flu-like symptoms")
      - confidence: number 0-100
      - symptoms_extracted: array of strings
      - advice: the harmless precautions provided at the end (string)
      - summary: a professional summary of the patient's report.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            symptoms_extracted: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["condition", "confidence", "symptoms_extracted", "advice", "summary"]
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
