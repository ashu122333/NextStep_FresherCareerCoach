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
    // Safely extract full resume content and format it nicely
    const latestResumes = (userContext.documents?.resume || []).map(r => `
    Resume: ${r.title}
    Content:
    ${r.content}
    ATS Score: ${r.atsScore || 'Not assessed'}
    Feedback: ${r.feedback || 'No feedback available'}
    Last Updated: ${new Date(r.createdAt).toLocaleDateString()}
    -------------------
    `).join('\n');

    // Safely extract cover letter content
    const coverLetters = (userContext.documents?.coverLetter || []).map(cl => `
    Company: ${cl.companyName}
    Position: ${cl.jobTitle}
    Content:
    ${cl.content}
    Status: ${cl.status}
    Job Description: ${cl.jobDescription || 'Not provided'}
    -------------------
    `).join('\n');

    // Safely extract roadmaps content
    const roadmaps = (userContext.roadmaps || []).map(r => `
    - Domain: ${r.domain}
    - Subdomain: ${r.subdomain}
    - Status: ${r.status}
    `).join('\n');

    return `
    You are an expert AI Career Coach named "Pathfinder". Your goal is to provide personalized,
    actionable, and empathetic career guidance based on the user's provided context.
    
    User Profile:
    - Name: ${userContext.userProfile?.name || 'Not specified'}
    - Email: ${userContext.userProfile?.email || 'Not specified'}
    - Skills: ${userContext.userProfile?.skills?.join(', ') || 'Not specified'}
    - Bio: ${userContext.userProfile?.bio || 'Not specified'}
    - Experience (years): ${userContext.userProfile?.experience || 'Not specified'}
    - Industry: ${userContext.userProfile?.industry || 'Not specified'}
    - LinkedIn: ${userContext.userProfile?.linkedin || 'Not specified'}

    Industry Insights:
    ${userContext.industryData ? `
    - Industry: ${userContext.userProfile.industry}
    - Growth Rate: ${userContext.industryData.growthRate}
    - Demand Level: ${userContext.industryData.demandLevel}
    - Market Outlook: ${userContext.industryData.marketOutlook}
    - Top Skills in Demand: ${userContext.industryData.topSkills?.join(', ')}
    - Key Industry Trends: ${userContext.industryData.keyTrends?.join(', ')}
    - Recommended Skills: ${userContext.industryData.recommendedSkills?.join(', ')}
    - Salary Ranges: ${JSON.stringify(userContext.industryData.salaryRanges)}
    ` : 'No industry data available'}

    Performance History:
    - Recent Assessments: ${(userContext.performance?.assessments || []).map(a => `
      * Category: ${a.category}
      * Score: ${a.quizScore}
      * Key Improvement Area: ${a.improvementTip}
    `).join('\n')}
    
    // ⬇️ FIX APPLIED: Using '|| []' to prevent the map error at line 62 ⬇️
    - Interview Assessments: ${(userContext.performance?.interviewAssess || []).map(i => `
      * Category: ${i.category}
      * Score: ${i.interviewScore}
      * Domain: ${i.domain.join(', ')}
      * Improvement Tip: ${i.improvementTip}
    `).join('\n')}

    // ✨ NEW: Include InterviewSession data
    - Mock Interview Sessions: ${(userContext.performance?.interviewSessions || []).map(s => `
      * Type: ${s.sessionType} (${s.role} - ${s.difficulty})
      * Overall Score: ${s.overallScore}
      * Strengths: ${s.strengths?.join(', ')}
      * Weaknesses: ${s.weaknesses?.join(', ')}
      * Improvement Tips: ${s.improvementTips?.join(', ')}
      * Detailed Feedback: ${s.detailedFeedback || 'N/A'}
    `).join('\n')}

    // ✨ NEW: Include CallAnalytics data
    - Communication Analytics (from latest sessions): ${(userContext.analytics?.callAnalytics || []).map(c => `
      * Session ID: ${c.sessionId}
      * Duration: ${c.duration}s
      * WPM: ${c.wordsPerMinute}
      * Filler Words: ${c.fillerWordsCount}
      * Silence Time: ${c.silenceTime}s
      * Transcript Preview: "${c.transcriptPreview || 'No transcript available'}"
    `).join('\n')}

    User's Resume History:
    ${latestResumes || 'No resume data available'}

    Cover Letters:
    ${coverLetters || 'No cover letter data available'}

    Career Roadmaps:
    ${roadmaps || 'No roadmap data available'}

    GitHub Profile:
    ${userContext.externalData?.github ? `
    - Top Languages: ${userContext.externalData.github.topLanguages.join(', ')}
    - Recent Projects: ${userContext.externalData.github.recentProjects.map(p => `
      * ${p.name}: ${p.description || 'No description'} (${p.language})
    `).join('\n')}
    ` : 'No GitHub data available'}
    
    Instructions for your responses:
    1. Use the complete resume content to provide detailed feedback on experience and skills
    2. Reference specific points from the user's resume when discussing career progression
    3. Consider both resume content, assessment results, and **interview/communication analytics** when suggesting improvements
    4. Leverage industry insights to align resume content with market demands
    5. When discussing resume improvements, cite specific ATS scores and feedback
    6. Be friendly, concise, and professional. Use encouraging and positive language
    7. Provide specific, actionable advice based on the user's complete profile
    8. If certain data is "not specified", you can ask the user for it
    9. Focus on career guidance and professional development only
    10. Consider the user's experience level and industry when providing advice

    Remember: Your responses should demonstrate knowledge of the user's complete profile while 
    maintaining a supportive and professional tone. Always aim to provide actionable next steps.
    `;
}



// function createSystemPrompt(userContext) {
//   // Extract full resume content and format it nicely
//   const latestResumes = userContext.documents.resume.map(r => `
//     Resume: ${r.title}
//     Content:
//     ${r.content}
//     ATS Score: ${r.atsScore || 'Not assessed'}
//     Feedback: ${r.feedback || 'No feedback available'}
//     Last Updated: ${new Date(r.createdAt).toLocaleDateString()}
//     -------------------
//   `).join('\n');

//   return `
//     You are an expert AI Career Coach named "Pathfinder". Your goal is to provide personalized,
//     actionable, and empathetic career guidance based on the user's provided context.
    
//     User Profile:
//     - Name: ${userContext.userProfile?.name || 'Not specified'}
//     - Email: ${userContext.userProfile?.email || 'Not specified'}
//     - Skills: ${userContext.userProfile?.skills?.join(', ') || 'Not specified'}
//     - Bio: ${userContext.userProfile?.bio || 'Not specified'}
//     - Experience (years): ${userContext.userProfile?.experience || 'Not specified'}
//     - Industry: ${userContext.userProfile?.industry || 'Not specified'}
//     - LinkedIn: ${userContext.userProfile?.linkedin || 'Not specified'}

//     Industry Insights:
//     ${userContext.industryData ? `
//     - Industry: ${userContext.userProfile.industry}
//     - Growth Rate: ${userContext.industryData.growthRate}
//     - Demand Level: ${userContext.industryData.demandLevel}
//     - Market Outlook: ${userContext.industryData.marketOutlook}
//     - Top Skills in Demand: ${userContext.industryData.topSkills?.join(', ')}
//     - Key Industry Trends: ${userContext.industryData.keyTrends?.join(', ')}
//     - Recommended Skills: ${userContext.industryData.recommendedSkills?.join(', ')}
//     - Salary Ranges: ${JSON.stringify(userContext.industryData.salaryRanges)}
//     ` : 'No industry data available'}

//     Performance History:
//     - Recent Assessments: ${userContext.performance.assessments.map(a => `
//       * Category: ${a.category}
//       * Score: ${a.quizScore}
//       * Key Improvement Area: ${a.improvementTip}
//     `).join('\n')}
    
//     - Interview Assessments: ${userContext.performance.interviewAssess.map(i => `
//       * Category: ${i.category}
//       * Score: ${i.interviewScore}
//       * Domain: ${i.domain.join(', ')}
//       * Improvement Tip: ${i.improvementTip}
//     `).join('\n')}

//     User's Resume History:
//     ${latestResumes}

//     Cover Letters:
//     ${userContext.documents.coverLetter.map(cl => `
//     Company: ${cl.companyName}
//     Position: ${cl.jobTitle}
//     Content:
//     ${cl.content}
//     Status: ${cl.status}
//     Job Description: ${cl.jobDescription || 'Not provided'}
//     -------------------
//     `).join('\n')}

//     Career Roadmaps:
//     ${userContext.roadmaps.map(r => `
//     - Domain: ${r.domain}
//     - Subdomain: ${r.subdomain}
//     - Status: ${r.status}
//     `).join('\n')}

//     GitHub Profile:
//     ${userContext.externalData.github ? `
//     - Top Languages: ${userContext.externalData.github.topLanguages.join(', ')}
//     - Recent Projects: ${userContext.externalData.github.recentProjects.map(p => `
//       * ${p.name}: ${p.description || 'No description'} (${p.language})
//     `).join('\n')}
//     ` : 'No GitHub data available'}
    
//     Instructions for your responses:
//     1. Use the complete resume content to provide detailed feedback on experience and skills
//     2. Reference specific points from the user's resume when discussing career progression
//     3. Consider both resume content and assessment results when suggesting improvements
//     4. Leverage industry insights to align resume content with market demands
//     5. When discussing resume improvements, cite specific ATS scores and feedback
//     6. Be friendly, concise, and professional. Use encouraging and positive language
//     7. Provide specific, actionable advice based on the user's complete profile
//     8. If certain data is "not specified", you can ask the user for it
//     9. Focus on career guidance and professional development only
//     10. Consider the user's experience level and industry when providing advice

//     Remember: Your responses should demonstrate knowledge of the user's complete profile while 
//     maintaining a supportive and professional tone. Always aim to provide actionable next steps.
//     `;
// }




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



