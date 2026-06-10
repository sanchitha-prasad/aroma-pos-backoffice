import React, { useEffect } from 'react';
import { theme } from 'antd';

export const TableSkeleton: React.FC = () => {
  const { token } = theme.useToken();

  useEffect(() => {
    const styleId = 'skeleton-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .pulse-placeholder {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const pulseBg = token.colorFillTertiary;

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title block placeholder */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="pulse-placeholder" style={{ width: 140, height: 28, borderRadius: 4, background: pulseBg }} />
          <div className="pulse-placeholder" style={{ width: 80, height: 16, borderRadius: 4, background: pulseBg }} />
        </div>
        <div className="pulse-placeholder" style={{ width: 100, height: 36, borderRadius: 4, background: pulseBg }} />
      </div>

      {/* Toolbar placeholder */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div className="pulse-placeholder" style={{ width: 200, height: 32, borderRadius: 4, background: pulseBg }} />
        <div className="pulse-placeholder" style={{ width: 80, height: 32, borderRadius: 4, background: pulseBg }} />
      </div>

      {/* Table rows placeholder */}
      <div style={{ 
        flex: 1, 
        border: `1px solid ${token.colorBorderSecondary}`, 
        borderRadius: 8, 
        padding: 16, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16, 
        background: token.colorBgContainer 
      }}>
        {/* Table header */}
        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${token.colorBorderSecondary}`, paddingBottom: 12 }}>
          <div className="pulse-placeholder" style={{ flex: 1, height: 20, borderRadius: 4, background: pulseBg }} />
          <div className="pulse-placeholder" style={{ width: 120, height: 20, borderRadius: 4, background: pulseBg }} />
          <div className="pulse-placeholder" style={{ width: 120, height: 20, borderRadius: 4, background: pulseBg }} />
          <div className="pulse-placeholder" style={{ width: 80, height: 20, borderRadius: 4, background: pulseBg }} />
        </div>
        {/* Table rows */}
        {[...Array(6)].map((_, index) => (
          <div key={index} style={{ display: 'flex', gap: 24, alignItems: 'center', borderBottom: index < 5 ? `1px solid ${token.colorBorderSecondary}` : 'none', paddingBottom: index < 5 ? 16 : 0 }}>
            <div className="pulse-placeholder" style={{ flex: 1, height: 20, borderRadius: 4, background: pulseBg }} />
            <div className="pulse-placeholder" style={{ width: 120, height: 20, borderRadius: 4, background: pulseBg }} />
            <div className="pulse-placeholder" style={{ width: 120, height: 20, borderRadius: 4, background: pulseBg }} />
            <div className="pulse-placeholder" style={{ width: 80, height: 20, borderRadius: 4, background: pulseBg }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
