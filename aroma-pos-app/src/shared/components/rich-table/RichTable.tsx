import React, { useState } from 'react';
import { Table, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import QuickFilterTabs from './QuickFilterTabs';
import TableFooterBar from './TableFooterBar';
import type { QuickFilter } from './types';

interface RichTableProps<T extends object> {
    // Data
    data: T[];
    columns: ColumnsType<T>;
    rowKey: keyof T | ((row: T) => string);
    isLoading?: boolean;

    // Toolbar
    quickFilters?: QuickFilter[];
    activeFilterKey?: string;
    onFilterChange?: (key: string) => void;
    toolbarRight?: React.ReactNode;

    // Filter bar (search + dropdowns)
    filterBar?: React.ReactNode;

    // Table body scroll height
    scrollY?: string | number;

    // Pagination (controlled externally for slice logic)
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    totalLabel?: string;

    // Row click
    onRow?: (row: T) => { onClick?: () => void };
}

function RichTable<T extends object>({
    data, columns, rowKey, isLoading = false,
    quickFilters, activeFilterKey, onFilterChange,
    toolbarRight, filterBar, scrollY = 'calc(100vh - 340px)',
    currentPage, pageSize, totalItems,
    onPageChange, onPageSizeChange, totalLabel = 'records',
    onRow,
}: RichTableProps<T>) {
    const { token } = theme.useToken();

    const hasToolbar = !!(quickFilters?.length || toolbarRight);
    const hasFilterBar = !!filterBar;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                background: token.colorBgContainer,
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                overflow: 'hidden',
                height: '100%',
            }}
        >
            {/* ── Toolbar: quick filter pills + right actions ── */}
            {hasToolbar && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 20px',
                        borderBottom: hasFilterBar ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                        flexShrink: 0,
                    }}
                >
                    {quickFilters && activeFilterKey !== undefined && onFilterChange && (
                        <QuickFilterTabs
                            filters={quickFilters}
                            activeKey={activeFilterKey}
                            onChange={onFilterChange}
                        />
                    )}
                    {toolbarRight && <div style={{ marginLeft: 'auto' }}>{toolbarRight}</div>}
                </div>
            )}

            {/* ── Filter bar: search + dropdowns ── */}
            {hasFilterBar && (
                <div
                    style={{
                        padding: '10px 20px 12px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        flexShrink: 0,
                    }}
                >
                    {filterBar}
                </div>
            )}

            {/* ── Table body ── */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <Table
                    dataSource={data}
                    columns={columns}
                    rowKey={rowKey as string}
                    loading={isLoading}
                    pagination={false}
                    // Only apply fixed scroll when there is data — prevents phantom
                    // scrollbars rendered by Ant Design's overflow:auto container on empty tables
                    scroll={data.length > 0 ? { x: 'max-content', y: scrollY } : undefined}
                    onRow={onRow}
                    style={{ height: '100%' }}
                    className="rich-table"
                />
            </div>

            {/* ── Footer: pagination ── */}
            <TableFooterBar
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalItems}
                totalLabel={totalLabel}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
}

export default RichTable;
