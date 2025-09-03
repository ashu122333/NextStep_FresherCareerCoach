import React from 'react'
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import {getIndustryInsights} from '@/actions/dashboard'
import DashboardView from "./_components/dashboard-view"

const IndustryInsights = async () => {
    // check if user is alread onboarded
  
    const {isOnboarded} = await getUserOnboardingStatus();
    const insights = await getIndustryInsights();

    if (!isOnboarded) redirect("/onboarding");
  return (
    <div className='container max-auto'>
      <DashboardView insights={insights} />
    </div>
  )
}

export default IndustryInsights
