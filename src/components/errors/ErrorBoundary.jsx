import React from 'react';
import { Link } from 'react-router-dom';
import { logClientError } from '@/api/errors/logClientError';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logClientError({
      message: error?.message ?? 'Render error',
      stack: error?.stack,
      context: {
        componentStack: info?.componentStack,
        boundary: 'ErrorBoundary',
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback" role="alert">
          <h1 className="error-fallback-title">Something went wrong</h1>
          <p className="error-fallback-text">
            We&apos;ve logged this issue. Try refreshing the page or go back home.
          </p>
          <div className="error-fallback-actions">
            <button
              type="button"
              className="veridian-btn veridian-btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
            <Link to="/home" className="btn btn-secondary">
              Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
