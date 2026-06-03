import React from 'react';
import { theme } from 'antd';
import type { QuickFilter } from './types';

interface QuickFilterTabsProps {
    filters: QuickFilter[];
    activeKey: string;
    onChange: (key: string) => void;
}

const QuickFilterTabs: React.FC<QuickFilterTabsProps> = ({ filters, activeKey, onChange }) => {
    const { token } = theme.useToken();

    return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {filters.map(f => {
                const isActive = f.key === activeKey;
                return (
                    <button
                        key={f.key}
                        onClick={() => onChange(f.key)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 14px',
                            borderRadius: 20,
                            border: isActive ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                            background: isActive ? token.colorPrimary : token.colorBgContainer,
                            color: isActive ? '#fff' : token.colorText,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            lineHeight: '20px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {f.label}
                        {f.count !== undefined && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: 9,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    lineHeight: 1,
                                    padding: '0 5px',
                                    background: isActive
                                        ? 'rgba(255,255,255,0.25)'
                                        : token.colorFillSecondary,
                                    color: isActive ? '#fff' : token.colorTextSecondary,
                                }}
                            >
                                {f.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default QuickFilterTabs;
