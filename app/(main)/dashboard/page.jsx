import React from 'react'
import { getUserOnboardingStatus } from '@/actions/user';
import { redirect } from 'next/navigation';
import {getIndustryInsights} from '@/actions/dashboard'
import DashboardView from "./_components/dashboard-view"

const IndustryInsights = async () => {
    // check if user is alread onboarded
  
    const {isOnboarded} = await getUserOnboardingStatus();
    

    if (!isOnboarded) redirect("/onboarding");

    const insights = await getIndustryInsights();
  return (
    <div className='container mx-auto'>
      <DashboardView insights={insights} />
    </div>
  )
}

export default IndustryInsights
