import React from 'react'
import Link from "next/link";
import { PictureInPicture2 } from "lucide-react";
import { Button,CardFooter } from "@/components/ui/button";


const mockInterview = () => {
  return (
    <div>
      <h1 className="text-6xl font-bold gradient gradient-title">Mock Interview</h1>
      <p>Prepare for your upcoming interviews with our AI-powered mock interview tool.</p>
      <Link href={"https://prep-wise-olive.vercel.app/sign-in"} className="flex items-center gap-2">
          <Button>
          Mock Interview
        </Button>
      </Link>
    </div>
    
  )
}

export default mockInterview
