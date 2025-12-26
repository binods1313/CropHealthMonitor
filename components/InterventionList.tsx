import React from 'react';
import { Intervention } from '../types';

interface InterventionListProps {
  interventions: Intervention[];
}

const InterventionList: React.FC<InterventionListProps> = ({ interventions }) => {
  return (
    <div className="space-y-4">
      {interventions.map((item, idx) => (
        <div key={idx} className="intervention-card bg-white border-l-4 border-agri-500 rounded-r-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-agri-100 text-agri-800 text-xs rounded-full">
                {item.rank}
              </span>
              {item.action}
            </h4>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded uppercase tracking-wide">
              {item.timing}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
            <div>
              <p className="text-gray-500 text-xs">Cost</p>
              <p className="font-medium text-gray-700">{item.cost}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Impact</p>
              <p className="font-medium text-emerald-600">{item.impact}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Confidence</p>
              <p className="font-medium text-gray-700">{Math.round(item.confidence * 100)}%</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Materials</p>
              <p className="font-medium text-gray-700 break-words">{item.materials.join(', ')}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InterventionList;
