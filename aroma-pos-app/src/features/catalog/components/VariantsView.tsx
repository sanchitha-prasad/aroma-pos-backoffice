import React, { useState } from 'react';
import {
    Button, Space, Input, Modal, Typography, Popconfirm,
    message, Tag, Form, Switch, Skeleton,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { UseMutationResult } from '@tanstack/react-query';
import { Variant } from '../../../shared/types';
import { RichTable } from '../../../shared/components/rich-table';

const { Title } = Typography;

interface VariantsViewProps {
    variants: Variant[];
    isLoading?: boolean;
    createVariant: UseMutationResult<any, any, any, any>;
    updateVariant: UseMutationResult<any, any, any, any>;
    deleteVariant: UseMutationResult<any, any, any, any>;
}

const SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` }) as unknown as Variant);
const SKELETON_COLUMNS: ColumnsType<Variant> = [
    { key: 'name',      title: 'Name',        width: 200, render: () => <Skeleton.Input active size="small" style={{ width: 130 }} /> },
    { key: 'desc',      title: 'Description', width: 320, render: () => <Skeleton.Input active size="small" style={{ width: 220 }} /> },
    { key: 'status',    title: 'Status',      width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At',  width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action',    title: 'Action',      width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const VariantsView: React.FC<VariantsViewProps> = ({
    variants,
    isLoading = false,
    createVariant,
    updateVariant,
    deleteVariant,
}) => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const openModal = (variant?: Variant) => {
        setEditingVariant(variant || null);
        if (variant) {
            form.setFieldsValue({
                name: variant.name,
                description: variant.description,
                isActive: variant.isActive,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingVariant) {
                await updateVariant.mutateAsync({ id: editingVariant.id, data: values });
                message.success('Variant updated');
            } else {
                await createVariant.mutateAsync(values);
                message.success('Variant created');
            }
            setIsModalOpen(false);
        } catch {
            message.error('Failed to save variant');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteVariant.mutateAsync(id);
            message.success('Variant deleted');
        } catch {
            message.error('Failed to delete variant');
        }
    };

    const filtered = React.useMemo(() => {
        return variants.filter(v => {
            if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
                !(v.description || '').toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter === 'active' && !v.isActive) return false;
            if (statusFilter === 'inactive' && v.isActive) return false;
            return true;
        });
    }, [variants, search, statusFilter]);

    const paginated = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const quickFilters = React.useMemo(() => {
        const all = variants.length;
        const active = variants.filter(v => v.isActive).length;
        return [
            { key: 'all',      label: 'All',      count: all },
            { key: 'active',   label: 'Active',   count: active },
            { key: 'inactive', label: 'Inactive', count: all - active },
        ];
    }, [variants]);

    const columns: ColumnsType<Variant> = [
        {
            title: 'Name', dataIndex: 'name', key: 'name', width: 200,
            render: (t: string) => <b>{t}</b>,
        },
        { title: 'Description', dataIndex: 'description', key: 'desc', width: 320 },
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
            render: (_: any, r: Variant) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
                    <Popconfirm title="Delete this variant?" onConfirm={() => handleDelete(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteVariant.isPending} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search variants…"
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
                <Title level={2} style={{ margin: 0 }}>Variants</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    New Variant
                </Button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <RichTable<Variant>
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
                    totalLabel="variants"
                    scrollY="calc(100vh - 320px)"
                />
            </div>

            <Modal
                title={editingVariant ? 'Edit Variant' : 'Create Variant'}
                open={isModalOpen}
                onOk={handleSave}
                confirmLoading={createVariant.isPending || updateVariant.isPending}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} name="variant_form" layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Large" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VariantsView;
