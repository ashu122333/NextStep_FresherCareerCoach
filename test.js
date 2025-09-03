import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAk2WpSSBghSw9fjbwNxS1lK6bMzDiy9fE");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
const prompt = `
  Analyze the current state of the ${industry} industry. Provide a comprehensive analysis with a primary focus on the major Indian market (cities like Bengaluru, Mumbai, Delhi-NCR, Hyderabad) and a comparative perspective on key international markets (e.g., USA, Europe). The output should be in ONLY the following JSON format without any additional notes or explanations:
  {
    "salaryRanges": [
      { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
    ],
    "growthRate": number,
    "demandLevel": "High" | "Medium" | "Low",
    "topSkills": ["skill1", "skill2"],
    "marketOutlook": "Positive" | "Neutral" | "Negative",
    "keyTrends": ["trend1", "trend2"],
    "recommendedSkills": ["skill1", "skill2"]
  }
  
  IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
  
  The "salaryRanges" array should include at least 5 common roles. The locations should be a mix of major Indian cities (e.g., Bengaluru, Mumbai) and international hubs (e.g., San Francisco, London).
  Growth rate should be a percentage.
  Include at least 5 skills and trends relevant to both the Indian and global markets.
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  console.log(JSON.parse(cleanedText))
};
generateAIInsights("tech-artificial-intelligence/machine-learning")