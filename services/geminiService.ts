
import { GoogleGenAI, Type } from "@google/genai";

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Cheia API Gemini nu a fost găsită. Funcționalitățile AI vor fi dezactivate.");
}

// FIX: Initialize GoogleGenAI only if API_KEY is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        containerNumber: { type: Type.STRING, description: 'Numărul containerului, ex., MSCU1234567. Trebuie să conțină 4 litere și 7 cifre.' },
        billOfLading: { type: Type.STRING, description: 'Numărul Bill of Lading (B/L).' },
        vesselName: { type: Type.STRING, description: 'Numele navei.' },
        departureDate: { type: Type.STRING, description: 'Data plecării în format AAAA-LL-ZZ.' },
        eta: { type: Type.STRING, description: 'Data estimată a sosirii (ETA) în format AAAA-LL-ZZ.' },
        portOfLoading: { type: Type.STRING, description: 'Portul unde a fost încărcată marfa.' },
        portOfDischarge: { type: Type.STRING, description: 'Portul unde va fi descărcată marfa.' },
    },
     propertyOrdering: ["containerNumber", "billOfLading", "vesselName", "departureDate", "eta", "portOfLoading", "portOfDischarge"],
};

export const parseEmailWithGemini = async (emailContent: string): Promise<string> => {
    // FIX: Check for both API_KEY and the ai instance.
    if (!API_KEY || !ai) {
        return Promise.resolve(JSON.stringify({ error: "Cheia API nu este configurată." }, null, 2));
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analizează conținutul următorului email de logistică și extrage informațiile cheie în format JSON.
            
            Conținut Email:
            ---
            ${emailContent}
            ---
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Eroare la apelarea API-ului Gemini:", error);
        // FIX: Ensure error is of type Error before accessing message property.
        const errorMessage = error instanceof Error ? error.message : String(error);
        return JSON.stringify({ error: "Eroare la analiza emailului cu AI.", details: errorMessage }, null, 2);
    }
};
