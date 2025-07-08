// src/components/ErrorBoundary.jsx
// This component acts as an Error Boundary for its child components.
// It catches JavaScript errors anywhere in its child component tree,
// logs those errors, and displays a fallback UI instead of crashing
// the entire application.
//
// Usage: Wrap any component that might crash with this ErrorBoundary.
// Example: <ErrorBoundary><MyPotentiallyCrashingComponent /></ErrorBoundary>

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // This lifecycle method is called after an error has been thrown by a descendant component.
  // It receives the error that was thrown as a parameter.
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // This lifecycle method is called after an error has been thrown by a descendant component.
  // It receives two parameters: error (the error that was thrown) and info (an object
  // with a componentStack key containing information about which component threw the error).
  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="bg-red-900 text-offWhite p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full text-center">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong with this component.</h2>
          <p className="text-lg mb-4">We're working to fix it. Please try reloading the page or contact support if the issue persists.</p>
          {/* Optionally show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-3 bg-red-800 rounded-lg text-sm text-left max-h-48 overflow-auto">
              <summary className="font-semibold cursor-pointer">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 text-offWhite font-bold py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
