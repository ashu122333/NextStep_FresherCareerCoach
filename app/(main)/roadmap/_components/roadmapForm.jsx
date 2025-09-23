"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { generateRoadmapAction } from "@/actions/roadmap";

// Define the form validation schema
const roadmapFormSchema = z.object({
  domain: z.string().min(1, "Domain is required."),
  subdomain: z.string().min(1, "Subdomain is required."),
  hoursPerDay: z.number().int().min(1).max(24),
  duration: z.string().min(1, "Duration is required."),
  goal: z.string().min(1, "Goal is required."),
  schedulePattern: z.string().min(1, "Schedule pattern is required."),
  existingKnowledge: z.string().min(1, "Existing knowledge is required."),
  motivation: z.string().min(1, "Motivation is required."),
  exercisesCount: z.number().int().min(0),
  extras: z.string().optional(),
});

export default function RoadmapForm() {
  const [formData, setFormData] = useState({
    domain: "",
    subdomain: "",
    hoursPerDay: "",
    duration: "",
    goal: "",
    schedulePattern: "",
    existingKnowledge: "",
    motivation: "",
    exercisesCount: "",
    extras: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const validatedData = roadmapFormSchema.safeParse({
      ...formData,
      hoursPerDay:
        formData.hoursPerDay === ""
          ? 0
          : parseInt(formData.hoursPerDay),
      exercisesCount:
        formData.exercisesCount === ""
          ? 0
          : parseInt(formData.exercisesCount),
    });

    if (!validatedData.success) {
      setError(validatedData.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      await generateRoadmapAction(validatedData.data);
      // Reload the page to show the new roadmap in the list
      window.location.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="subdomain">Subdomain</Label>
          <Input
            id="subdomain"
            name="subdomain"
            value={formData.subdomain}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="hoursPerDay">Hours Per Day</Label>
          <Input
            type="number"
            id="hoursPerDay"
            name="hoursPerDay"
            value={formData.hoursPerDay}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            name="duration"
            placeholder="e.g., 4 weeks"
            value={formData.duration}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal">Specific Goal</Label>
        <Input
          id="goal"
          name="goal"
          placeholder="e.g., Become a mid-level Data Scientist"
          value={formData.goal}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="schedulePattern">Schedule Pattern</Label>
        <Input
          id="schedulePattern"
          name="schedulePattern"
          placeholder="e.g., every weekday, weekends only"
          value={formData.schedulePattern}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="existingKnowledge">Existing Knowledge</Label>
        <Textarea
          id="existingKnowledge"
          name="existingKnowledge"
          placeholder="e.g., 'I know Python basics and some SQL.'"
          value={formData.existingKnowledge}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="motivation">Motivation</Label>
        <Textarea
          id="motivation"
          name="motivation"
          placeholder="e.g., 'I want to switch careers into tech.'"
          value={formData.motivation}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="exercisesCount">Number of Exercises</Label>
        <Input
          type="number"
          id="exercisesCount"
          name="exercisesCount"
          value={formData.exercisesCount}
          onChange={handleChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="extras">Extra Notes</Label>
        <Textarea
          id="extras"
          name="extras"
          placeholder="e.g., 'I prefer video resources over text-based ones.'"
          value={formData.extras}
          onChange={handleChange}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full relative">
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <Spinner className="h-4 w-4" /> <span>Generating...</span>
          </div>
        ) : (
          "Generate Roadmap"
        )}
      </Button>
      {error && (
        <div className="mt-4 p-2 text-sm text-red-400 bg-red-900 rounded-md">
          {error}
        </div>
      )}
    </form>
  );
}
