import { getResumes } from "@/actions/resume";
import ResumeBuilder from "./_components/resume-builder";
import ResumeList from "./_components/resume-list";

export default async function ResumePage() {
  const resumes = await getResumes();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ResumeList initialResumes={resumes} />
    </div>
  );
}