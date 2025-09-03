import { industries } from '@/data/industries'
import React from 'react'
import OnboardingForm from './_components/onboarding-form.jsx'
import { getUserOnboardingStatus } from '@/actions/user'
import { redirect } from 'next/navigation'

const OnboardingPage = async () => {
  // check if user is alread onboarded

  const {isOnboarding} = await getUserOnboardingStatus();
  if (isOnboarding) redirect("/dashboard");

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  )
}

export default OnboardingPage
