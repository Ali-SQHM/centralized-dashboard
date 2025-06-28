// src/pages/SocialMediaHubPage.jsx
// This component serves as the Social Media Hub for staff.
// It includes:
// 1. A direct link to Adobe Express for post scheduling.
// 2. A "Content Creation Assistant" powered by the Gemini 2.0 Flash LLM.
// 3. A placeholder for future Analytics Feedback Loop.
//
// Styled to match the consistent dark theme.

import React, { useState, useCallback } from 'react';

const SocialMediaHubPage = ({ db, firestoreAppId }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Function to call the Gemini 2.0 Flash LLM for content generation
  const generateContent = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for content generation.");
      return;
    }

    setLoading(true);
    setGeneratedContent('');
    setError(null);
    setCopySuccess('');

    try {
      const chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };

      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setGeneratedContent(text);
      } else {
        setError("No content generated. Please try a different prompt.");
        console.warn("LLM response structure unexpected:", result);
      }
    } catch (err) {
      console.error("Error generating content:", err);
      setError(`Failed to generate content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  // Function to copy generated content to clipboard
  const copyToClipboard = useCallback(() => {
    if (generatedContent) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = generatedContent;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopySuccess('Copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
        setCopySuccess('Failed to copy!');
      }
    }
  }, [generatedContent]);


  return (
    <div className="p-4 bg-deepGray text-offWhite min-h-full rounded-xl">
      <h2 className="text-3xl font-bold text-teal-400 mb-6">Social Media Hub</h2>
      <p className="text-gray-300 mb-8">Manage your social media presence, generate content ideas, and analyze performance.</p>

      <div className="bg-darkGray p-6 rounded-xl shadow-lg border border-gray-700 mb-8 text-center">
        <h3 className="text-xl font-semibold text-white mb-4">Adobe Express for Post Scheduling</h3>
        <p className="text-gray-300 mb-4">Use Adobe Express to design and schedule your social media posts seamlessly.</p>
        <a
          href="https://new.express.adobe.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
        >
          Go to Adobe Express
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 0 002 2h10a2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="bg-darkGray p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Content Creation Assistant (AI Powered)</h3>
        <p className="text-gray-300 mb-4">Need ideas for your next social media post? Describe your topic below!</p>
        
        <textarea
          className="w-full p-3 bg-deepGray text-offWhite rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 h-32 resize-y"
          placeholder="e.g., 'Generate 3 engaging Instagram captions for a new product launch about eco-friendly packaging.' or 'Write a short tweet about the benefits of CNC machining.'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>
        
        <button
          onClick={generateContent}
          disabled={loading || !prompt.trim()}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          {loading ? 'Generating...' : 'Generate Content'}
        </button>

        {error && (
          <p className="text-red-400 mt-4 text-center">{error}</p>
        )}

        {generatedContent && (
          <div className="mt-6 p-4 bg-deepGray rounded-xl border border-gray-700 relative">
            <h4 className="text-lg font-semibold text-white mb-2">Generated Content:</h4>
            <pre className="whitespace-pre-wrap text-gray-200 font-sans text-sm break-words overflow-auto max-h-64">
              {generatedContent}
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute top-2 right-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-xl transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {copySuccess || 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-darkGray p-6 rounded-xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Analytics Feedback Loop</h3>
        <p className="text-gray-300 mb-4">Monitor your social media performance and gather insights here.</p>
        <div className="p-4 bg-deepGray rounded-xl border border-gray-700 text-center">
          <p className="text-gray-400">Future integration with analytics platforms like Google Analytics, Facebook Insights, etc.</p>
          <button className="mt-4 px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700 text-white font-semibold transition duration-200">View Analytics</button>
        </div>
      </div>

    </div>
  );
};

export default SocialMediaHubPage;