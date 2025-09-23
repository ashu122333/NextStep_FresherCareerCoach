import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react"; // Import icons

const TaskTypeColors = {
  learning: "bg-blue-100 text-blue-700 border-blue-300",
  project: "bg-green-100 text-green-700 border-green-300",
  assessment: "bg-purple-100 text-purple-700 border-purple-300"
};

const MilestoneProgress = ({ milestone, completedTasks }) => {
  const total = milestone.tasks.length;
  const completed = completedTasks.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{completed}/{total} tasks</span>
        <span>{percentage}%</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        // Add color based on completion
        style={{
          background: percentage === 100 ? '#dcfce7' : undefined,
          '--progress-value': `${percentage}%`
        }}
      />
    </div>
  );
};

const Task = ({ task, isCompleted, onToggle }) => (
  <Card className={`p-4 transition-all duration-200 ${
    isCompleted ? 'bg-green-50 border-green-200' : 'hover:shadow-md'
  }`}>
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center gap-2">
        <Badge 
          variant="outline" 
          className={`${TaskTypeColors[task.type]} capitalize`}
        >
          {task.type}
        </Badge>
        <button
          onClick={onToggle}
          className="focus:outline-none"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          )}
        </button>
      </div>
      <div className={isCompleted ? 'text-gray-600' : ''}>
        <h4 className="font-medium mb-1">{task.title}</h4>
        <p className="text-sm text-gray-600">
          {task.description}
        </p>
      </div>
    </div>
  </Card>
);

export default function RoadmapContent({ data, roadmapId, inputs, domain, subdomain }) {
  const [completedTasks, setCompletedTasks] = useState({});
  
  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`roadmap-progress-${roadmapId}`);
    if (saved) {
      setCompletedTasks(JSON.parse(saved));
    }
  }, [roadmapId]);

  // Save progress to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      `roadmap-progress-${roadmapId}`,
      JSON.stringify(completedTasks)
    );
  }, [completedTasks, roadmapId]);

  const toggleTask = (milestoneIndex, taskIndex) => {
    setCompletedTasks(prev => {
      const key = `${milestoneIndex}-${taskIndex}`;
      const newCompleted = { ...prev };
      
      if (newCompleted[key]) {
        delete newCompleted[key];
      } else {
        newCompleted[key] = true;
      }
      
      return newCompleted;
    });
  };

  const getMilestoneCompletedTasks = (milestoneIndex) => {
    return Object.keys(completedTasks).filter(key => 
      key.startsWith(`${milestoneIndex}-`)
    );
  };

  // Parse JSON if it's a string
  let roadmapData = data;
  if (typeof data === 'string') {
    try {
      roadmapData = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse roadmap data:', e);
      return null;
    }
  }

  if (!roadmapData || !roadmapData.title) return null;

  return (
    <Card className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{roadmapData.title}</h2> {/* Changed from data.title to roadmapData.title */}
        <div className="grid gap-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline">{inputs?.duration}</Badge>
            <Badge variant="outline">{domain}</Badge>
            <Badge variant="outline">{subdomain}</Badge>
          </div>
          {/* Add a debug log here */}
          {console.log('Inputs:', inputs)}
          <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
            {inputs && (
              <>
                <div>
                  <span className="font-semibold text-slate-800">Goal: </span>
                  <p className="text-gray-600 mt-1">{inputs.goal}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Motivation: </span>
                  <p className="text-gray-600 mt-1">{inputs.motivation}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Schedule: </span>
                  <p className="text-gray-600 mt-1">
                    {inputs.hoursPerDay} hours per day, {inputs.schedulePattern}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {roadmapData.milestones?.map((milestone, mIdx) => (
          <div key={mIdx} className="relative">
            {/* Timeline dot and line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
            <div className={`absolute left-[-5px] top-2 w-[10px] h-[10px] rounded-full ${
              getMilestoneCompletedTasks(mIdx).length === milestone.tasks.length
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`} />

            <div className="ml-8">
              {/* Milestone header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-blue-800">
                  {milestone.title}
                </h3>
                <p className="text-gray-600 mt-1">{milestone.description}</p>
                <MilestoneProgress 
                  milestone={milestone} 
                  completedTasks={getMilestoneCompletedTasks(mIdx)}
                />
              </div>

              {/* Tasks grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {milestone.tasks?.map((task, tIdx) => (
                  <Task
                    key={tIdx}
                    task={task}
                    isCompleted={completedTasks[`${mIdx}-${tIdx}`]}
                    onToggle={(e) => {
                      e.stopPropagation();
                      toggleTask(mIdx, tIdx);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}