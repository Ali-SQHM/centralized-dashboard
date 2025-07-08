// src/pages/InstantQuoteAppPage.jsx
// This component renders the public-facing Instant Quote application page.
// It provides a form for users to get a quote.
// It now features a "secret door" for staff login: clicking the main title
// "Instant Quote Generator" five times rapidly will navigate to the AuthPage.

import React, { useState, useRef } from 'react';
// No longer need FaGoogle here as the button is removed.
// import { FaGoogle } from 'react-icons/fa6';

function InstantQuoteAppPage({ db, isAuthorizedStaff, navigateTo }) {
  const [quoteDetails, setQuoteDetails] = useState({
    productType: '',
    quantity: 1,
    deliveryDate: '',
    notes: ''
  });
  const [quoteResult, setQuoteResult] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  // Ref and state for the secret login trigger
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const CLICK_THRESHOLD = 5; // Number of clicks required
  const TIME_WINDOW_MS = 1000; // Time window for rapid clicks (1 second)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQuoteDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    setLoadingQuote(true);
    setQuoteError('');
    setQuoteResult(null);

    // Simulate API call for quote generation
    try {
      // In a real application, you would call an API or a Firebase Function here
      // For now, a simple mock response
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      if (!quoteDetails.productType || !quoteDetails.quantity) {
        throw new Error("Please fill in all required fields (Product Type, Quantity).");
      }

      const mockPrice = (quoteDetails.quantity * 100).toFixed(2); // Example pricing logic
      setQuoteResult({
        message: `Your estimated quote for ${quoteDetails.quantity} of ${quoteDetails.productType} is: $${mockPrice}`,
        details: quoteDetails
      });
    } catch (error) {
      console.error("Error generating quote:", error);
      setQuoteError("Failed to generate quote: " + error.message);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleTitleClick = () => {
    const currentTime = Date.now();

    // Reset count if too much time has passed between clicks
    if (currentTime - lastClickTimeRef.current > TIME_WINDOW_MS) {
      clickCountRef.current = 0;
    }

    clickCountRef.current += 1;
    lastClickTimeRef.current = currentTime;

    console.log(`Title clicked. Current count: ${clickCountRef.current}`);

    if (clickCountRef.current >= CLICK_THRESHOLD) {
      clickCountRef.current = 0; // Reset count after successful trigger
      navigateTo('authPage'); // Navigate to the login page
      console.log("Secret login triggered!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-darkGray text-offWhite p-6 md:p-8">
      <div className="bg-mediumGray p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-center border border-gray-700">
        <h1
          className="text-3xl md:text-4xl font-bold text-lightGreen mb-6 cursor-pointer select-none"
          onClick={handleTitleClick}
          title={`Click ${CLICK_THRESHOLD} times for staff login`} // Optional: for debugging/staff reminder
        >
          Instant Quote Generator
        </h1>
        <p className="text-gray-300 mb-8">
          Get an immediate estimate for your custom product needs.
        </p>

        <form onSubmit={handleSubmitQuote} className="space-y-4 text-left">
          <div>
            <label htmlFor="productType" className="block text-gray-300 text-sm font-bold mb-2">
              Product Type:
            </label>
            <input
              type="text"
              id="productType"
              name="productType"
              value={quoteDetails.productType}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-600 rounded-xl w-full py-3 px-4 bg-deepGray text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
              placeholder="e.g., Custom Metal Fabrication, Bespoke Artwork"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-gray-300 text-sm font-bold mb-2">
              Quantity:
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={quoteDetails.quantity}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-600 rounded-xl w-full py-3 px-4 bg-deepGray text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
              min="1"
              required
            />
          </div>
          <div>
            <label htmlFor="deliveryDate" className="block text-gray-300 text-sm font-bold mb-2">
              Desired Delivery Date (Optional):
            </label>
            <input
              type="date"
              id="deliveryDate"
              name="deliveryDate"
              value={quoteDetails.deliveryDate}
              onChange={handleInputChange}
              className="shadow appearance-none border border-gray-600 rounded-xl w-full py-3 px-4 bg-deepGray text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-gray-300 text-sm font-bold mb-2">
              Additional Notes (Optional):
            </label>
            <textarea
              id="notes"
              name="notes"
              value={quoteDetails.notes}
              onChange={handleInputChange}
              rows="4"
              className="shadow appearance-none border border-gray-600 rounded-xl w-full py-3 px-4 bg-deepGray text-offWhite leading-tight focus:outline-none focus:ring-2 focus:ring-lightGreen"
              placeholder="Any specific requirements, materials, or details..."
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-lightGreen text-deepGray font-bold py-3 px-6 rounded-xl hover:bg-green-400 transition duration-200 shadow-lg flex items-center justify-center text-lg"
            disabled={loadingQuote}
          >
            {loadingQuote ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-deepGray" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Generate Quote'
            )}
          </button>
        </form>

        {quoteError && (
          <p className="text-red-500 mt-4">{quoteError}</p>
        )}

        {quoteResult && (
          <div className="mt-8 p-6 bg-deepGray rounded-xl border border-gray-600 text-left">
            <h3 className="text-xl font-semibold text-lightGreen mb-3">Your Quote:</h3>
            <p className="text-offWhite mb-2">{quoteResult.message}</p>
            <p className="text-gray-400 text-sm">Product: {quoteResult.details.productType}</p>
            <p className="text-gray-400 text-sm">Quantity: {quoteResult.details.quantity}</p>
            {quoteResult.details.deliveryDate && <p className="text-gray-400 text-sm">Delivery: {quoteResult.details.deliveryDate}</p>}
            {quoteResult.details.notes && <p className="text-gray-400 text-sm">Notes: {quoteResult.details.notes}</p>}
          </div>
        )}

        {/* The Staff Login button is now removed from here and triggered by title clicks */}
      </div>
    </div>
  );
}

export default InstantQuoteAppPage;
