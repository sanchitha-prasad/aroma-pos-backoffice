import React, { useState } from 'react';
import {
    Button, Space, Input, Modal, Typography, Popconfirm, message,
    Select, Tag, Form, Switch, Skeleton,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { UseMutationResult } from '@tanstack/react-query';
import { Category, Device, Tax } from '../../../shared/types';
import { RichTable } from '../../../shared/components/rich-table';

const { Title } = Typography;

interface CategoryViewProps {
    categories: Category[];
    devices?: Device[];
    taxes?: Tax[];
    isLoading?: boolean;
    createCategory: UseMutationResult<any, any, any, any>;
    updateCategory: UseMutationResult<any, any, any, any>;
    deleteCategory: UseMutationResult<any, any, any, any>;
}

const SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` }) as unknown as Category);
const SKELETON_COLUMNS: ColumnsType<Category> = [
    { key: 'name',   title: 'Name',        width: 180, render: () => <Skeleton.Input active size="small" style={{ width: 120 }} /> },
    { key: 'desc',   title: 'Description', width: 260, render: () => <Skeleton.Input active size="small" style={{ width: 200 }} /> },
    { key: 'taxes',  title: 'Taxes',       width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'status', title: 'Status',      width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action', title: 'Action',      width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const CategoryView: React.FC<CategoryViewProps> = ({
    categories,
    devices = [],
    taxes = [],
    isLoading = false,
    createCategory,
    updateCategory,
    deleteCategory,
}) => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const openModal = (cat?: Category) => {
        setEditingCat(cat || null);
        if (cat) {
            form.setFieldsValue({
                name: cat.name,
                description: cat.description,
                isActive: cat.isActive,
                taxIds: cat.taxes?.map(t => t.id) ?? cat.taxIds ?? [],
                printerIds: cat.printers?.map((d: any) => d.id) ?? cat.printerIds ?? [],
                kitchenDisplayIds: cat.kitchenDisplays?.map((d: any) => d.id) ?? cat.kitchenDisplayIds ?? [],
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
            if (editingCat) {
                await updateCategory.mutateAsync({ id: editingCat.id, data: values });
                message.success('Category updated');
            } else {
                await createCategory.mutateAsync(values);
                message.success('Category created');
            }
            setIsModalOpen(false);
        } catch {
            message.error('Failed to save category');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory.mutateAsync(id);
            message.success('Category deleted');
        } catch {
            message.error('Failed to delete category');
        }
    };

    const filtered = React.useMemo(() => {
        return categories.filter(c => {
            if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
                !(c.description || '').toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter === 'active' && !c.isActive) return false;
            if (statusFilter === 'inactive' && c.isActive) return false;
            return true;
        });
    }, [categories, search, statusFilter]);

    const paginated = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const quickFilters = React.useMemo(() => {
        const all = categories.length;
        const active = categories.filter(c => c.isActive).length;
        return [
            { key: 'all',      label: 'All',      count: all },
            { key: 'active',   label: 'Active',   count: active },
            { key: 'inactive', label: 'Inactive', count: all - active },
        ];
    }, [categories]);

    const printers = devices.filter(d => d.type?.name === 'PRINTER');
    const kdsScreens = devices.filter(d => d.type?.name === 'KDS' || d.type?.name === 'Kitchen Display');

    const columns: ColumnsType<Category> = [
        {
            title: 'Name', dataIndex: 'name', key: 'name', width: 180,
            render: (t: string) => <b>{t}</b>,
        },
        { title: 'Description', dataIndex: 'description', key: 'desc', width: 260 },
        {
            title: 'Taxes', key: 'taxes', width: 180,
            render: (_: any, r: Category) =>
                r.taxes?.length
                    ? r.taxes.map(t => <Tag key={t.id} color="purple">{t.name}</Tag>)
                    : <span style={{ color: '#ccc' }}>—</span>,
        },
        {
            title: 'KDS Screens', key: 'kds', width: 180,
            render: (_: any, r: Category) =>
                r.kitchenDisplays?.length
                    ? r.kitchenDisplays.map((d: any) => <Tag key={d.id} color="blue">{d.name}</Tag>)
                    : <span style={{ color: '#ccc' }}>—</span>,
        },
        {
            title: 'Printers', key: 'printers', width: 180,
            render: (_: any, r: Category) =>
                r.printers?.length
                    ? r.printers.map((d: any) => <Tag key={d.id} color="green">{d.name}</Tag>)
                    : <span style={{ color: '#ccc' }}>—</span>,
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
            render: (_: any, r: Category) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
                    <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteCategory.isPending} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search categories…"
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
                <Title level={2} style={{ margin: 0 }}>Categories</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    New Category
                </Button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <RichTable<Category>
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
                    totalLabel="categories"
                    scrollY="calc(100vh - 320px)"
                />
            </div>

            <Modal
                title={editingCat ? 'Edit Category' : 'Create Category'}
                open={isModalOpen}
                onOk={handleSave}
                confirmLoading={createCategory.isPending || updateCategory.isPending}
                onCancel={() => setIsModalOpen(false)}
                width={600}
            >
                <Form form={form} name="category_form" layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Beverages" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                    <Form.Item name="taxIds" label="Applicable Taxes">
                        <Select
                            mode="multiple"
                            placeholder="Select taxes"
                            optionFilterProp="label"
                            options={taxes.map(t => ({ value: t.id, label: `${t.name} (${t.percentage}%)` }))}
                        />
                    </Form.Item>
                    <Form.Item name="kitchenDisplayIds" label="KDS Routing">
                        <Select
                            mode="multiple"
                            placeholder="Select KDS screens"
                            optionFilterProp="label"
                            options={kdsScreens.map(d => ({ value: d.id, label: d.name }))}
                        />
                    </Form.Item>
                    <Form.Item name="printerIds" label="Printer Routing">
                        <Select
                            mode="multiple"
                            placeholder="Select printers"
                            optionFilterProp="label"
                            options={printers.map(d => ({ value: d.id, label: d.name }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryView;
