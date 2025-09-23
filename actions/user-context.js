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
        resume: true,
        coverLetter: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        industryInsight: true
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
      },
      performance: {
        assessments: dbData.assessments,
        interviewAssess: dbData.interviewAssess,
      },
      documents: {
        resume: dbData.resume,
        coverLetter: dbData.coverLetter,
      },
      externalData: {
        github: githubData,
      },
    };

    return context;

  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    // Re-throw the error or return a structured error object as needed for your front end.
    throw error;
  }
}


