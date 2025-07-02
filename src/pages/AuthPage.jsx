     // src/pages/AuthPage.jsx
     import React from 'react';

     function AuthPage({ onGoogleSignIn, navigateTo }) {
       return (
         <div className="flex flex-col items-center justify-center h-full bg-darkGray rounded-xl shadow-md p-6 text-center">
           <h2 className="text-3xl font-bold mb-6 text-lightGreen">Staff Login</h2>
           <p className="text-offWhite mb-4">Please sign in with your authorized Google account.</p>
           <button
             onClick={onGoogleSignIn}
             className="bg-blue-600 text-offWhite font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg flex items-center justify-center"
           >
             <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
               <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.328-7.439-7.464 0-4.136 3.344-7.464 7.439-7.464 2.29 0 3.986.947 4.976 1.858l3.18-3.179C19.232 2.042 16.51 0 12.24 0 5.463 0 0 5.336 0 12c0 6.663 5.463 12 12.24 12 6.821 0 11.854-4.735 11.854-11.536 0-.78-.07-1.53-.199-2.256H12.24z" />
             </svg>
             Sign In with Google
           </button>
           <button
             onClick={() => navigateTo('instantQuote')}
             className="mt-4 text-gray-400 hover:text-lightGreen transition duration-200"
           >
             Continue to Public Quote
           </button>
         </div>
       );
     }

     export default AuthPage;