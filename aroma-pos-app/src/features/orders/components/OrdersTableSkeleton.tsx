import React from 'react';
import { Skeleton, Table } from 'antd';

const SKELETON_ROW_COUNT = 10;

const skeletonColumns = [
    { title: 'Order #', key: 'order', width: 100 },
    { title: 'Table', key: 'table', width: 120 },
    { title: 'Type', key: 'type', width: 110 },
    { title: 'Status', key: 'status', width: 120 },
    { title: 'Tickets', key: 'tickets', width: 90 },
    { title: 'Total Amount', key: 'amount', width: 130 },
    { title: 'Actions', key: 'actions', width: 130 },
].map((col) => ({
    ...col,
    render: () => <Skeleton.Input active size="small" style={{ width: '80%', minWidth: 0 }} />,
}));

const skeletonRows = Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => ({ key: i }));

const OrdersTableSkeleton: React.FC = () => (
    <Table
        dataSource={skeletonRows}
        columns={skeletonColumns}
        pagination={false}
        rowKey="key"
        scroll={{ x: 'max-content' }}
    />
);

export default OrdersTableSkeleton;
