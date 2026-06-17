import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App.jsx';
import QueryProvider from '@/providers/QueryProvider';
import AuthProvider from '@/providers/AuthProvider';
import ErrorBoundary from '@/components/errors/ErrorBoundary';
import GlobalErrorHandlers from '@/components/errors/GlobalErrorHandlers';
import { Toaster } from '@/components/ui/sonner';
import '@/css/app.css';
import '@/index.css';
import { initStudyAiDebugFromUrl } from '@/utils/study/studyAiTrace';

initStudyAiDebugFromUrl();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryProvider>
      <AuthProvider>
        <GlobalErrorHandlers />
        <div className="app-root-shell">
          <BrowserRouter>
            <div className="app-router-outlet">
              <App />
            </div>
          </BrowserRouter>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryProvider>
  </ErrorBoundary>,
);
