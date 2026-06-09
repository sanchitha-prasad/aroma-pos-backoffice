import React, { useEffect } from 'react';

const PageLoader: React.FC = () => {
  useEffect(() => {
    // Inject keyframe animation styles if not already present
    const styleId = 'page-loader-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes loader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .premium-loader-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(97, 50, 192, 0.1);
          border-top: 3px solid #6132C0;
          border-right: 3px solid #6132C0;
          border-radius: 50%;
          animation: loader-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .premium-loader-text {
          margin-top: 16px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #6132C0;
          letter-spacing: 0.05em;
          animation: pulse-text 1.5s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        height: '100%',
        width: '100%',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div className="premium-loader-spinner" />
      <div className="premium-loader-text">Loading Screen...</div>
    </div>
  );
};

export default PageLoader;
