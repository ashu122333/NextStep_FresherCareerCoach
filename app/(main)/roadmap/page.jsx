"use client";

import React, { useState, useEffect } from "react";
import RoadmapForm from "./_components/roadmapForm";
import RoadmapContent from "./_components/RoadmapContent";
import { getUserRoadmaps } from "@/actions/roadmap";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react"; // Import icons

export default function Page() {
  const [showForm, setShowForm] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null); // Track which roadmap is expanded

  useEffect(() => {
    async function fetchRoadmaps() {
      setLoading(true);
      try {
        const data = await getUserRoadmaps();
        console.log("Fetched roadmaps:", data); // Debug log
        setRoadmaps(data);
      } catch (e) {
        console.error("Error fetching roadmaps:", e);
        setRoadmaps([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRoadmaps();
  }, [showForm]);

  const toggleRoadmap = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Roadmaps</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Create Roadmap"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <RoadmapForm />
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : roadmaps.length === 0 ? (
        <div className="text-center text-gray-500">No roadmaps found.</div>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => {
            let roadmapData = roadmap.aiJson;
            // Parse aiJson if it's a string
            if (typeof roadmapData === "string") {
              try {
                roadmapData = JSON.parse(roadmapData);
              } catch (e) {
                console.error("Failed to parse roadmap data:", e);
                roadmapData = null;
              }
            }

            // Parse inputs if it's a string
            let inputs = roadmap.inputs;
            if (typeof inputs === "string") {
              try {
                inputs = JSON.parse(inputs);
                console.log('Parsed inputs:', inputs); // Debug log
              } catch (e) {
                console.error("Failed to parse inputs:", e);
                inputs = null;
              }
            }

            const isExpanded = expandedId === roadmap.id;

            return (
              <div key={roadmap.id}>
                <Card
                  className="p-4 cursor-pointer hover:bg-slate-50/50 transition-all border hover:border-slate-200 hover:shadow-sm"
                  onClick={() => toggleRoadmap(roadmap.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h2 className="text-xl font-semibold">
                            {roadmap.domain} / {roadmap.subdomain}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            {inputs?.goal}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {inputs?.duration}
                      </Badge>
                      {!isExpanded && roadmapData && (
                        <Badge variant="outline">
                          {roadmapData.milestones?.length || 0} milestones
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
                {isExpanded && roadmapData && (
                  <div className="mt-2 animate-slideDown">
                    <RoadmapContent 
                      data={roadmapData} 
                      roadmapId={roadmap.id}
                      inputs={inputs} // Make sure this is the parsed object
                      domain={roadmap.domain}
                      subdomain={roadmap.subdomain}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
