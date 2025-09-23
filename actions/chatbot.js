"use server";

import { getUserContext } from './user-context';

// The API endpoint for the LLM
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";
const apiKey = process.env.GEMINI_API_KEY; // The API key is provided by the canvas environment.

/**
 * Generates a system prompt for the AI Career Coach.
 * This prompt defines the AI's persona, rules, and includes all user-specific data.
 * @param {object} userContext A comprehensive object containing all user data.
 * @returns {string} The complete system instruction string.
 */
function createSystemPrompt(userContext) {
  // Use a template literal to construct a detailed prompt.
  return `
    You are an expert AI Career Coach named "Pathfinder". Your goal is to provide personalized,
    actionable, and empathetic career guidance based on the user's provided context.
    
    You have access to the following information about the user:
    - User Profile:
      - Skills: ${userContext.userProfile?.skills?.join(', ') || 'Not specified'}
      - Bio: ${userContext.userProfile?.bio || 'Not specified'}
      - Experience (years): ${userContext.userProfile?.experience || 'Not specified'}
      - Industry Goal: ${userContext.userProfile?.industry || 'Not specified'}

    - Performance Data:
      - Most recent assessments: ${JSON.stringify(userContext.performance?.assessments) || 'No assessment data available'}
      - Most recent interview feedback: ${JSON.stringify(userContext.performance?.interviewAssess) || 'No interview data available'}
    
    - Documents:
      - Latest Resume: ${userContext.documents?.resume?.content || 'No resume on file'}
      - Latest Cover Letter: ${userContext.documents?.coverLetter?.[0]?.content || 'No cover letter on file'}
      
    - External Profile Data:
      - GitHub:
        - Top Languages: ${userContext.externalData?.github?.topLanguages?.join(', ') || 'Not specified'}
        - Recent Projects: ${JSON.stringify(userContext.externalData?.github?.recentProjects) || 'Not specified'}
        
    
    Instructions for your responses:
    1. Acknowledge and use the provided context to inform your answers. If a piece of data is "not specified", you can ask the user for it.
    2. Be friendly, concise, and professional. Use encouraging and positive language.
    3. Your primary goal is to provide specific, actionable advice. If the user asks about skill development, recommend concrete steps. If they ask for interview help, suggest a specific practice area based on their history.
    4. Do not mention that you are an AI or that you are using an LLM. Your persona is "Pathfinder".
    5. Always assume the user's latest question is a new part of the conversation unless they explicitly reference a previous turn.
    6. If the user's request is outside the scope of career guidance (e.g., "Tell me a joke"), respond politely that you can only assist with career-related queries.
    `;
}

/**
 * Sends a chat message to the LLM and gets a response.
 * @param {string} userMessage The user's query.
 * @returns {Promise<string>} The AI-generated response.
 */
export async function getChatbotResponse(userMessage) {
    try {
        const userContext = await getUserContext();
        if (!userContext) {
            throw new Error("User context not found. Cannot proceed with chat.");
        }
        
        const systemPrompt = createSystemPrompt(userContext);

        const payload = {
            contents: [{ parts: [{ text: userMessage }] }],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
        };

        const response = await fetch(API_URL + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];
        
        if (candidate && candidate.content?.parts?.[0]?.text) {
          const text = candidate.content.parts[0].text;
          return text;
        } else {
          throw new Error("LLM response was not in the expected format or was empty.");
        }

    } catch (error) {
        console.error('Error in getChatbotResponse:', error);
        return "I'm sorry, I seem to be having trouble processing your request right now. Please try again in a moment.";
    }
}



import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generates content from the Gemini API.
 * This function handles the communication with the LLM, including error handling.
 * @param {string} userPrompt - The full prompt to send to the AI.
 * @returns {Promise<string>} The generated text response from the AI.
 */
export async function generateContent(userPrompt) {
  // Ensure the API key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // If the error response has a JSON body, log it for debugging.
    if (error.response) {
      console.error("API Response:", await error.response.json());
    }
    throw new Error("Failed to communicate with AI service.");
  }
}





// export async function generateContentAi(personaPrompt) {
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   try {
//   const result = await model.generateContent(personaPrompt);
//   const response = result.response;
//   const text = response.text();
//     return text;

//   } catch (error) {
//     console.error("Error calling Gemini API:", error);
//     if (error.response) {
//       console.error("API Response:", await error.response.json());
//     }
//     throw new Error("Failed to communicate with AI service.");
//   }
// }


export async function generateContentAi(userContent, personaPrompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  if (!userContent || typeof userContent !== 'string' || userContent.trim() === '') {
    console.error("User content is empty or invalid. Cannot call the AI model.");
    throw new Error("User content is required to generate a response.");
  }

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: userContent }] }],
      systemInstruction: { parts: [{ text: personaPrompt }] }
    });

    const response = result.response;
    const text = response.text();
    return text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.response) {
      console.error("API Response:", await error.response.json());
    }
    throw new Error("Failed to communicate with AI service.");
  }
}



