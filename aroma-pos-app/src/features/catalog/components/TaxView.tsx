import React, { useState } from 'react';
import {
    Button, Space, Input, Modal, Typography, Popconfirm,
    message, Tag, Form, InputNumber, Switch, Skeleton,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { UseMutationResult } from '@tanstack/react-query';
import { Tax } from '../../../shared/types';
import { RichTable } from '../../../shared/components/rich-table';

const { Title } = Typography;

interface TaxViewProps {
    taxes: Tax[];
    isLoading?: boolean;
    createTax: UseMutationResult<any, any, any, any>;
    updateTax: UseMutationResult<any, any, any, any>;
    deleteTax: UseMutationResult<any, any, any, any>;
}

const SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` }) as unknown as Tax);
const SKELETON_COLUMNS: ColumnsType<Tax> = [
    { key: 'name',      title: 'Tax Name',   width: 220, render: () => <Skeleton.Input active size="small" style={{ width: 140 }} /> },
    { key: 'rate',      title: 'Rate',       width: 120, render: () => <Skeleton.Input active size="small" style={{ width: 70 }} /> },
    { key: 'status',    title: 'Status',     width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action',    title: 'Action',     width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const TaxView: React.FC<TaxViewProps> = ({
    taxes,
    isLoading = false,
    createTax,
    updateTax,
    deleteTax,
}) => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const openModal = (tax?: Tax) => {
        setEditingTax(tax || null);
        if (tax) {
            form.setFieldsValue({ name: tax.name, percentage: tax.percentage, isActive: tax.isActive });
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true, percentage: 0 });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingTax) {
                await updateTax.mutateAsync({ id: editingTax.id, data: values });
                message.success('Tax updated');
            } else {
                await createTax.mutateAsync(values);
                message.success('Tax created');
            }
            setIsModalOpen(false);
        } catch {
            message.error('Failed to save tax');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTax.mutateAsync(id);
            message.success('Tax deleted');
        } catch {
            message.error('Failed to delete tax');
        }
    };

    const filtered = React.useMemo(() => {
        return taxes.filter(t => {
            if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter === 'active' && !t.isActive) return false;
            if (statusFilter === 'inactive' && t.isActive) return false;
            return true;
        });
    }, [taxes, search, statusFilter]);

    const paginated = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const quickFilters = React.useMemo(() => {
        const all = taxes.length;
        const active = taxes.filter(t => t.isActive).length;
        return [
            { key: 'all',      label: 'All',      count: all },
            { key: 'active',   label: 'Active',   count: active },
            { key: 'inactive', label: 'Inactive', count: all - active },
        ];
    }, [taxes]);

    const columns: ColumnsType<Tax> = [
        {
            title: 'Tax Name', dataIndex: 'name', key: 'name', width: 220,
            render: (t: string) => <b>{t}</b>,
        },
        {
            title: 'Rate', key: 'rate', width: 120,
            render: (_: any, r: Tax) => (
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {r.percentage.toFixed(2)}%
                </span>
            ),
        },
        {
            title: 'Status', dataIndex: 'isActive', key: 'status', width: 100,
            render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>,
        },
        {
            title: 'Created At', dataIndex: 'createdOnUtc', key: 'createdAt', width: 160,
            render: (v: string) => v
                ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                : '—',
        },
        {
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: Tax) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
                    <Popconfirm
                        title="Delete this tax?"
                        description="This will remove it from all assigned categories."
                        onConfirm={() => handleDelete(r.id)}
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteTax.isPending} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search taxes…"
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ maxWidth: 260 }}
                allowClear
            />
        </div>
    );

    return (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Tax Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    New Tax
                </Button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <RichTable<Tax>
                    data={isLoading ? SKELETON_DATA : paginated}
                    columns={isLoading ? SKELETON_COLUMNS : columns}
                    rowKey="id"
                    isLoading={false}
                    currentPage={page}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    onPageChange={setPage}
                    onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                    filterBar={filterBar}
                    quickFilters={isLoading ? undefined : quickFilters}
                    activeFilterKey={statusFilter}
                    onFilterChange={key => { setStatusFilter(key); setPage(1); }}
                    totalLabel="taxes"
                    scrollY="calc(100vh - 320px)"
                />
            </div>

            <Modal
                title={editingTax ? 'Edit Tax' : 'Create Tax'}
                open={isModalOpen}
                onOk={handleSave}
                confirmLoading={createTax.isPending || updateTax.isPending}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="name" label="Tax Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Sales Tax" />
                    </Form.Item>
                    <Form.Item name="percentage" label="Rate (%)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} max={100} precision={3} step={0.1} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TaxView;
