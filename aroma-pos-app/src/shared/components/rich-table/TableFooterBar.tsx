import React from 'react';
import { Select, Typography, theme } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

interface TableFooterBarProps {
    currentPage: number;
    pageSize: number;
    total: number;
    totalLabel?: string;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

const TableFooterBar: React.FC<TableFooterBarProps> = ({
    currentPage, pageSize, total, totalLabel = 'records',
    onPageChange, onPageSizeChange,
}) => {
    const { token } = theme.useToken();
    const totalPages = Math.ceil(total / pageSize);
    const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, total);

    const NavBtn: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({
        onClick, disabled, children,
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                borderRadius: 6,
                border: `1px solid ${token.colorBorderSecondary}`,
                background: disabled ? token.colorFillQuaternary : token.colorBgContainer,
                color: disabled ? token.colorTextDisabled : token.colorText,
                fontSize: 13,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 20px',
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
                borderRadius: '0 0 12px 12px',
                flexShrink: 0,
            }}
        >
            {/* Left: showing X to Y */}
            <Text type="secondary" style={{ fontSize: 13 }}>
                {total === 0
                    ? `No ${totalLabel}`
                    : `Showing ${from} to ${to} of ${total} ${totalLabel}`}
            </Text>

            {/* Right: page size + prev/next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Select
                    value={pageSize}
                    onChange={(val) => { onPageSizeChange(val); onPageChange(1); }}
                    options={PAGE_SIZE_OPTIONS.map(s => ({ value: s, label: `${s}` }))}
                    size="small"
                    style={{ width: 68 }}
                />
                <NavBtn
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <LeftOutlined style={{ fontSize: 10 }} /> Previous
                </NavBtn>
                <Text style={{ fontSize: 13, minWidth: 80, textAlign: 'center' }}>
                    Page {currentPage} of {totalPages || 1}
                </Text>
                <NavBtn
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    Next <RightOutlined style={{ fontSize: 10 }} />
                </NavBtn>
            </div>
        </div>
    );
};

export default TableFooterBar;
