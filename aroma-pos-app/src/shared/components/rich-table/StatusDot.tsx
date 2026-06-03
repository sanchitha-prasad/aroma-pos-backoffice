import React from 'react';

export type StatusDotVariant = 'success' | 'warning' | 'error' | 'processing' | 'default' | 'purple';

const DOT_COLORS: Record<StatusDotVariant, string> = {
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    processing: '#1677ff',
    default: '#d9d9d9',
    purple: '#6132C0',
};

interface StatusDotProps {
    variant: StatusDotVariant;
    label: string;
    pulse?: boolean;
}

const StatusDot: React.FC<StatusDotProps> = ({ variant, label, pulse = false }) => {
    const color = DOT_COLORS[variant];

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color,
            }}
        >
            <span
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    display: 'inline-block',
                    flexShrink: 0,
                    boxShadow: pulse ? `0 0 0 3px ${color}33` : undefined,
                }}
            />
            {label}
        </span>
    );
};

export default StatusDot;
