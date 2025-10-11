"use client";
import React from "react";

export default function ProfileCompletionBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full mt-4">
      <p className="text-sm font-medium text-gray-700 mb-1">
        Profile completed at {percentage}%
      </p>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 bg-pink-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}