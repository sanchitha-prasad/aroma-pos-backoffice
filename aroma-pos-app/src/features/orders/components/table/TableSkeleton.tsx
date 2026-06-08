import React from 'react';
import { Skeleton, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface SkeletonRow {
    key: number;
}

const SKELETON_COLUMNS: ColumnsType<SkeletonRow> = [
    { title: 'Ticket #', width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { title: 'Table / Customer', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { title: 'Type', width: 110, render: () => <Skeleton.Input active size="small" style={{ width: 70 }} /> },
    { title: 'Total', width: 110, render: () => <Skeleton.Input active size="small" style={{ width: 70 }} /> },
    { title: 'Paid', width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { title: 'Balance', width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { title: 'Status', width: 120, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { title: 'Created', width: 150, render: () => <Skeleton.Input active size="small" style={{ width: 110 }} /> },
    { title: '', width: 80, render: () => <Skeleton.Button active size="small" style={{ width: 60 }} /> },
];

interface TableSkeletonProps {
    rows?: number;
    scrollY: number | string;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 10, scrollY }) => {
    const data: SkeletonRow[] = Array.from({ length: rows }, (_, i) => ({ key: i }));

    return (
        <Table
            dataSource={data}
            columns={SKELETON_COLUMNS}
            rowKey="key"
            pagination={false}
            scroll={{ x: 'max-content', y: scrollY }}
        />
    );
};

export default TableSkeleton;
