"use client";

import { useState } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ResumeBuilder from "./resume-builder";
import { deleteResume } from "@/actions/resume";
import { toast } from "sonner";

export default function ResumeList({ initialResumes }) {
  const [resumes, setResumes] = useState(initialResumes || []); // Add default empty array
  const [selectedResume, setSelectedResume] = useState(null);
  const [showNewResumeDialog, setShowNewResumeDialog] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");

  const handleCreateResume = () => {
    if (!newResumeTitle.trim()) {
      toast.error("Please enter a resume title");
      return;
    }
    
    if (resumes.some(r => r.title === newResumeTitle.trim())) {
      toast.error("A resume with this title already exists");
      return;
    }

    setSelectedResume({ title: newResumeTitle.trim() });
    setShowNewResumeDialog(false);
    setNewResumeTitle("");
  };

  const handleDeleteResume = async (id) => {
    try {
      await deleteResume(id);
      setResumes(resumes.filter(r => r.id !== id));
      toast.success("Resume deleted successfully");
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  if (selectedResume) {
    return (
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setSelectedResume(null)}
          className="mb-4"
        >
          ← Back to Resumes
        </Button>
        <ResumeBuilder 
          initialContent={selectedResume}
          onSave={(newResume) => {
            setResumes(prev => {
              const index = prev.findIndex(r => r.id === newResume.id);
              if (index >= 0) {
                return [...prev.slice(0, index), newResume, ...prev.slice(index + 1)];
              }
              return [...prev, newResume];
            });
            setSelectedResume(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Resumes</h1>
        <Dialog open={showNewResumeDialog} onOpenChange={setShowNewResumeDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Resume
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Resume Title"
                value={newResumeTitle}
                onChange={(e) => setNewResumeTitle(e.target.value)}
              />
              <Button onClick={handleCreateResume}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resumes?.map((resume) => ( // Add optional chaining
          <div
            key={resume?.id || Math.random()} // Add fallback for key
            className="border rounded-lg p-4 space-y-4 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{resume?.title || 'Untitled'}</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: {resume?.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
                {resume?.atsScore && (
                  <p className="text-sm">ATS Score: {resume.atsScore}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteResume(resume?.id)}
                disabled={!resume?.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelectedResume(resume)}
              disabled={!resume?.id}
            >
              <FileText className="h-4 w-4 mr-2" />
              Open Resume
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}