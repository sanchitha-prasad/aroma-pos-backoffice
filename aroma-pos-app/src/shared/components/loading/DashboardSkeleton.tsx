import React, { useEffect } from 'react';
import { Row, Col, theme } from 'antd';

export const DashboardSkeleton: React.FC = () => {
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
    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Cards block */}
      <Row gutter={[16, 16]}>
        {[...Array(4)].map((_, i) => (
          <Col key={i} xs={24} sm={12} lg={6}>
            <div style={{ 
              background: token.colorBgContainer, 
              border: `1px solid ${token.colorBorder}`, 
              borderRadius: 6, 
              padding: 20, 
              height: 104,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div className="pulse-placeholder" style={{ width: 80, height: 14, borderRadius: 4, background: pulseBg }} />
                <div className="pulse-placeholder" style={{ width: 110, height: 24, borderRadius: 4, background: pulseBg }} />
              </div>
              <div className="pulse-placeholder" style={{ width: 40, height: 40, borderRadius: 8, background: pulseBg }} />
            </div>
          </Col>
        ))}
      </Row>

      {/* Analytics block */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div style={{ 
            background: token.colorBgContainer, 
            border: `1px solid ${token.colorBorder}`, 
            borderRadius: 6, 
            padding: 20, 
            height: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div className="pulse-placeholder" style={{ width: 150, height: 20, borderRadius: 4, background: pulseBg }} />
            <div className="pulse-placeholder" style={{ flex: 1, borderRadius: 6, background: pulseBg }} />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ 
            background: token.colorBgContainer, 
            border: `1px solid ${token.colorBorder}`, 
            borderRadius: 6, 
            padding: 20, 
            height: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div className="pulse-placeholder" style={{ width: 120, height: 20, borderRadius: 4, background: pulseBg }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[...Array(5)].map((_, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="pulse-placeholder" style={{ width: 32, height: 32, borderRadius: '50%', background: pulseBg }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="pulse-placeholder" style={{ width: '70%', height: 12, borderRadius: 4, background: pulseBg }} />
                    <div className="pulse-placeholder" style={{ width: '40%', height: 10, borderRadius: 4, background: pulseBg }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardSkeleton;
