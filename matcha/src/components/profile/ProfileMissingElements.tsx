"use client";
import React from "react";

export default function ProfileMissingElements({
  required,
  optional,
}: {
  required: string[];
  optional: string[];
}) {
  return (
    <div className="mt-4 text-sm">
      {/* Éléments obligatoires manquants */}
      {required.length > 0 && (
        <div className="mb-3">
          <h4 className="font-semibold text-red-600 mb-1">
            ⚠️ Éléments obligatoires manquants :
          </h4>
          <ul className="list-disc list-inside text-red-500">
            {required.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Éléments optionnels manquants */}
      {optional.length > 0 && (
        <div>
          <h4 className="font-semibold text-yellow-600 mb-1">
            💡 Éléments optionnels manquants :
          </h4>
          <ul className="list-disc list-inside text-yellow-500">
            {optional.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}