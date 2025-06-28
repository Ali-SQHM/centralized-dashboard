// src/pages/KanbanBoardPage.jsx
// Placeholder for the Kanban Board.
// Styled to match the consistent dark theme.

import React from 'react';

const KanbanBoardPage = ({ db, firestoreAppId }) => {
  return (
    <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl">
      <h2 className="text-3xl font-bold text-yellow-400 mb-6">Kanban Board</h2>
      <p className="text-gray-300 mb-8">Visualize and manage your workflow with a customizable Kanban board for tasks and projects.</p>
      <div className="mt-8 p-6 bg-darkGray rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Coming Soon!</h3>
        <p className="text-gray-300">Drag-and-drop tasks through different stages of completion.</p>
        <button className="mt-4 px-4 py-2 bg-yellow-600 rounded-xl hover:bg-yellow-700 text-white font-semibold transition duration-200">View Boards</button>
      </div>
    </div>
  );
};

export default KanbanBoardPage;