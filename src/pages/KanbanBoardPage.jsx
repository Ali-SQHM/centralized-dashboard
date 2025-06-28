import React from 'react';

const KanbanBoardPage = ({ db, firestoreAppId }) => {
  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-yellow-300 mb-6">Kanban Board</h2>
      <p className="text-gray-300">Visualize and manage your workflow with a customizable Kanban board.</p>
      <div className="mt-8 p-6 bg-gray-700 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-300">Track tasks, projects, and manufacturing processes through different stages.</p>
      </div>
    </div>
  );
};

export default KanbanBoardPage;