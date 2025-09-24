"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });



export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,    //i will find the resume based on userId
      },
      update: {              // if found update the
        content,
      },
      create: {              // if not found create a new one
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}


export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      content: true,
      atsScore: true,
      feedback: true,
    }
  });
}


// ai to improve the resume components not the full resume
export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    7. Dont add any otherformation except the improved content
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}


export async function analyzeResumeWithAI({ resumeContent, jobDescription }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    You are an expert ATS (Applicant Tracking System) and resume reviewer. 
    Your task is to analyze the resume against the job description and return ONLY a JSON response.
    
    Resume Content:
    ${resumeContent}
    
    Job Description:
    ${jobDescription}
    
    Analyze and return a JSON object with exactly this structure:
    {
      "score": <number between 0-100>,
      "feedback": {
        "summary": "<brief overview>",
        "skillsAlignment": "<skills match analysis>",
        "experienceMatch": "<experience relevance>",
        "improvements": "<key improvement areas>"
      }
    }

    IMPORTANT: 
    1. Return ONLY the JSON object, no additional text or explanations
    2. Ensure all string values are properly escaped
    3. Use proper JSON format with double quotes for keys and string values
    4. Do not include any markdown or formatting
  `;

  try {
    // Generate AI analysis
    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysisText = response.text().trim();

    // Log the raw response for debugging
    console.log('Raw AI Response:', analysisText);

    // Clean the response - remove any potential markdown or extra characters
    const cleanedText = analysisText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Parse the AI response
    let analysis;
    try {
      analysis = JSON.parse(cleanedText);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.error('Cleaned Text:', cleanedText);
      throw new Error(`Failed to parse AI response: ${e.message}`);
    }

    // Validate the analysis structure
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid response format: not an object');
    }

    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      throw new Error('Invalid score value');
    }

    if (!analysis.feedback || typeof analysis.feedback !== 'object') {
      throw new Error('Invalid feedback format');
    }

    const requiredFields = ['summary', 'skillsAlignment', 'experienceMatch', 'improvements'];
    for (const field of requiredFields) {
      if (typeof analysis.feedback[field] !== 'string') {
        throw new Error(`Missing or invalid feedback field: ${field}`);
      }
    }

    // Update resume record with score and feedback
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        atsScore: analysis.score,
        feedback: JSON.stringify(analysis.feedback),
      },
      create: {
        userId: user.id,
        content: resumeContent,
        atsScore: analysis.score,
        feedback: JSON.stringify(analysis.feedback),
      },
    });

    return {
      score: analysis.score,
      feedback: analysis.feedback,
    };

  } catch (error) {
    console.error('Resume analysis error:', error);
    // Return a more specific error message
    throw new Error(`Resume analysis failed: ${error.message}`);
  }
}