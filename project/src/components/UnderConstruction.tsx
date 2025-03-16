import React from 'react';
import { Construction } from 'lucide-react';

export default function UnderConstruction() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600">
      <Construction className="h-16 w-16 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Under Construction</h2>
      <p>This feature is coming soon!</p>
    </div>
  );
}