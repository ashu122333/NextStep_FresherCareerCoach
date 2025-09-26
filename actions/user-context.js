"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import axios from 'axios';



export async function getGithubData(username) {
  if (!username) return null;
  try {
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`);
    const repos = reposResponse.data;

    // Process data to find top languages and recent project summaries.
    const languageCounts = {};
    const recentProjects = repos
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 5) // Get the 5 most recently updated projects.
      .map(repo => {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
        return {
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count
        };
      });

    const topLanguages = Object.keys(languageCounts).sort((a, b) => languageCounts[b] - languageCounts[a]).slice(0, 3);

    return {
      topLanguages,
      recentProjects,
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return null;
  }
}



export async function getUserContext() {

  const { userId } = await auth();
  if (!userId) {
    console.error("User not authenticated.");
    throw new Error("Unauthorized");
  }

  try {
    // 1. Fetch internal data from the database
    const dbData = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        interviewAssess: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },

        interviewSessions:{
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        callAnalytics: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },


        resume: true,
        coverLetter: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        industryInsight: true,
        roadmaps: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      },
    });

    if (!dbData) {
        console.error("User not found in the database.");
        throw new Error("User not found");
    }

    // 2. Extract GitHub username from the database data
    const githubUsername = dbData.github ? dbData.github.split('/').pop() : null;

    // 3. Fetch external data from GitHub
    const githubData = await getGithubData(githubUsername);

    // 4. Consolidate all data into a single context object.
    const context = {
      userProfile: {
        clerkId: dbData.clerkUserId,
        skills: dbData.skills,
        bio: dbData.bio,
        experience: dbData.experience,
        industry: dbData.industry,
        email: dbData.email,         // Add email
        name: dbData.name,           // Add name
        imageUrl: dbData.imageUrl,   // Add imageUrl
        linkedin: dbData.linkedin    // Add linkedin
      },
      industryData: dbData.industryInsight ? {
        salaryRanges: dbData.industryInsight.salaryRanges,
        growthRate: dbData.industryInsight.growthRate,
        demandLevel: dbData.industryInsight.demandLevel,
        topSkills: dbData.industryInsight.topSkills,
        marketOutlook: dbData.industryInsight.marketOutlook,
        keyTrends: dbData.industryInsight.keyTrends,
        recommendedSkills: dbData.industryInsight.recommendedSkills
      } : null,

      performance: {
        assessments: (dbData.assessments || []).map(assessment => ({
          quizScore: assessment.quizScore,
          category: assessment.category,
          improvementTip: assessment.improvementTip,
          questions: assessment.questions,
          createdAt: assessment.createdAt
        })),
        interviewSessions: (dbData.interviewSessions || []).map(session => ({
        sessionType: session.sessionType,
        industry: session.industry,
        difficulty: session.difficulty,
       overallScore: session.overallScore,
       strengths: session.strengths,
        weaknesses: session.weaknesses,
        improvementTips: session.improvementTips,
        detailedFeedback: session.detailedFeedback,
        status: session.status,
        role: session.role,
        endedAt: session.endedAt,
        createdAt: session.createdAt
         })),
        // interviewAssess: dbData.interviewAssess.map(interview => ({
        //   interviewScore: interview.interviewScore,
        //   category: interview.category,
        //   domain: interview.domain,
        //   improvementTip: interview.improvementTip,
        //   questions: interview.questions,
        //   createdAt: interview.createdAt
        // }))
      },

      // ✨ NEW: New 'analytics' section for CallAnalytics
      analytics: {
      callAnalytics: (dbData.callAnalytics || []).map(call => ({
      sessionId: call.sessionId,
      duration: call.duration,
      transcriptPreview: call.transcript ? call.transcript.substring(0, 200) + (call.transcript.length > 200 ? '...' : '') : null,
      speakingTime: call.speakingTime,
      silenceTime: call.silenceTime,
      wordsPerMinute: call.wordsPerMinute,
      fillerWordsCount: call.fillerWordsCount,
      endedAt: call.endedAt,
      createdAt: call.createdAt
      }))
      },

      documents: {
        resume: (dbData.resume || []).map(resume => ({
          title: resume.title,
          content: resume.content,
          atsScore: resume.atsScore,
          feedback: resume.feedback,
          createdAt: resume.createdAt
        })),
        coverLetter: (dbData.coverLetter || []).map(letter => ({
          companyName: letter.companyName,
          jobTitle: letter.jobTitle,
          content: letter.content,
          jobDescription: letter.jobDescription,
          status: letter.status,
          url: letter.url,
          createdAt: letter.createdAt
        }))

      },
      roadmaps: dbData.roadmaps ? dbData.roadmaps.map(roadmap => ({
        domain: roadmap.domain,
        subdomain: roadmap.subdomain,
        status: roadmap.status,
        aiJson: roadmap.aiJson,
        createdAt: roadmap.createdAt
      })) : [],
      externalData: {
        github: githubData,
      }
    };

    return context;

  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    // Re-throw the error or return a structured error object as needed for your front end.
    throw error;
  }
}


