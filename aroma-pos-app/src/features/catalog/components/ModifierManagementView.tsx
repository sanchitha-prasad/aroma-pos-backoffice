import React, { useState } from 'react';
import {
    Button, Space, Input, Modal, Typography, Card,
    theme, Popconfirm, message, InputNumber, Form, Tabs, Select, Row, Col, Tag, Switch, Skeleton
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    AppstoreOutlined, UnorderedListOutlined, MinusCircleOutlined, SearchOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Modifier, ModifierGroup } from '../../../shared/types';
import { RichTable } from '../../../shared/components/rich-table';
import { useCurrency } from '../../../shared/context/CurrencyContext';
import {
    useCreateModifier,
    useUpdateModifier,
    useDeleteModifier
} from '../hooks/useModifiers';
import {
    useCreateModifierGroup,
    useUpdateModifierGroup,
    useDeleteModifierGroup
} from '../hooks/useModifierGroups';

const { Title } = Typography;

interface ModifierManagementViewProps {
    allModifiers: Modifier[];
    allGroups: ModifierGroup[];
    isLoadingModifiers?: boolean;
    isLoadingGroups?: boolean;
    onModifierChange?: () => void;
}

const MOD_SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-mod-${i}` }) as unknown as Modifier);
const MOD_SKELETON_COLUMNS: ColumnsType<Modifier> = [
    { key: 'name', title: 'Name', width: 200, render: () => <Skeleton.Input active size="small" style={{ width: 120 }} /> },
    { key: 'description', title: 'Description', width: 300, render: () => <Skeleton.Input active size="small" style={{ width: 220 }} /> },
    { key: 'price', title: 'Price', width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action', title: 'Action', width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const GROUP_SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-grp-${i}` }) as unknown as ModifierGroup);
const GROUP_SKELETON_COLUMNS: ColumnsType<ModifierGroup> = [
    { key: 'name', title: 'Group Name', width: 200, render: () => <Skeleton.Input active size="small" style={{ width: 120 }} /> },
    { key: 'description', title: 'Description', width: 250, render: () => <Skeleton.Input active size="small" style={{ width: 180 }} /> },
    { key: 'constraints', title: 'Select Constraints', width: 180, render: () => <Skeleton.Input active size="small" style={{ width: 120 }} /> },
    { key: 'items', title: 'Modifiers', width: 120, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'active', title: 'Status', width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action', title: 'Action', width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const ModifierManagementView: React.FC<ModifierManagementViewProps> = ({
    allModifiers,
    allGroups,
    isLoadingModifiers = false,
    isLoadingGroups = false,
}) => {
    const { token } = theme.useToken();
    const { currencySymbol } = useCurrency();
    const [activeTab, setActiveTab] = useState('modifiers');

    const [isModModalOpen, setIsModModalOpen] = useState(false);
    const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
    const [modForm] = Form.useForm();

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
    const [groupForm] = Form.useForm();

    // TanStack Query Mutations
    const createMod = useCreateModifier();
    const updateMod = useUpdateModifier();
    const deleteMod = useDeleteModifier();

    const createGroup = useCreateModifierGroup();
    const updateGroup = useUpdateModifierGroup();
    const deleteGroup = useDeleteModifierGroup();

    // Modifiers Table States
    const [modSearch, setModSearch] = useState('');
    const [modPage, setModPage] = useState(1);
    const [modPageSize, setModPageSize] = useState(8);

    // Modifier Groups Table States
    const [groupSearch, setGroupSearch] = useState('');
    const [groupStatusFilter, setGroupStatusFilter] = useState('all');
    const [groupPage, setGroupPage] = useState(1);
    const [groupPageSize, setGroupPageSize] = useState(8);

    // Modifiers Filtering & Pagination
    const filteredModifiers = React.useMemo(() => {
        return (allModifiers ?? []).filter(m => {
            if (modSearch && !m.name.toLowerCase().includes(modSearch.toLowerCase()) && !(m.description || '').toLowerCase().includes(modSearch.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [allModifiers, modSearch]);

    const paginatedModifiers = React.useMemo(() => {
        const start = (modPage - 1) * modPageSize;
        return filteredModifiers.slice(start, start + modPageSize);
    }, [filteredModifiers, modPage, modPageSize]);

    // Modifier Groups Filtering & Pagination
    const filteredGroups = React.useMemo(() => {
        return (allGroups ?? []).filter(g => {
            if (groupSearch && !g.name.toLowerCase().includes(groupSearch.toLowerCase()) && !(g.description || '').toLowerCase().includes(groupSearch.toLowerCase())) {
                return false;
            }
            if (groupStatusFilter === 'active' && !g.isActive) return false;
            if (groupStatusFilter === 'inactive' && g.isActive) return false;
            return true;
        });
    }, [allGroups, groupSearch, groupStatusFilter]);

    const paginatedGroups = React.useMemo(() => {
        const start = (groupPage - 1) * groupPageSize;
        return filteredGroups.slice(start, start + groupPageSize);
    }, [filteredGroups, groupPage, groupPageSize]);

    const groupQuickFilters = React.useMemo(() => {
        const all = (allGroups ?? []).length;
        const active = (allGroups ?? []).filter(g => g.isActive).length;
        const inactive = all - active;
        return [
            { key: 'all', label: 'All', count: all },
            { key: 'active', label: 'Active', count: active },
            { key: 'inactive', label: 'Inactive', count: inactive },
        ];
    }, [allGroups]);

    const handleSaveModifier = async () => {
        try {
            const values = await (modForm as any).validateFields();
            if (editingModifier) {
                await updateMod.mutateAsync({ id: editingModifier.id, data: values });
                message.success('Modifier updated');
            } else {
                await createMod.mutateAsync(values);
                message.success('Modifier created');
            }
            setIsModModalOpen(false);
        } catch (error) {
            message.error('Failed to save modifier');
        }
    };

    const handleDeleteModifier = async (id: string) => {
        try {
            await deleteMod.mutateAsync(id);
            message.success('Modifier deleted');
        } catch (error) {
            message.error('Failed to delete modifier');
        }
    };

    const openModifierModal = (mod?: Modifier) => {
        setEditingModifier(mod || null);
        if (mod) (modForm as any).setFieldsValue(mod);
        else (modForm as any).resetFields();
        setIsModModalOpen(true);
    };

    const handleSaveGroup = async () => {
        try {
            const values = await (groupForm as any).validateFields();

            const payload = {
                ...values,
                modifierItems: values.modifierItems || []
            };

            if (editingGroup) {
                await updateGroup.mutateAsync({ id: editingGroup.id, data: payload });
                message.success('Group updated');
            } else {
                await createGroup.mutateAsync(payload);
                message.success('Group created');
            }
            setIsGroupModalOpen(false);
        } catch (error) {
            console.error(error);
            message.error('Failed to save group');
        }
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            await deleteGroup.mutateAsync(id);
            message.success('Group deleted');
        } catch (error) {
            message.error('Failed to delete group');
        }
    };

    const openGroupModal = (group?: ModifierGroup) => {
        setEditingGroup(group || null);
        if (group) {
            (groupForm as any).setFieldsValue({
                ...group,
                modifierItems: (group.modifierItems || []).map(item => ({
                    modifierId: item.modifierId || item.id,
                    minQuantity: item.minQuantity,
                    maxQuantity: item.maxQuantity,
                    quantity: item.quantity
                }))
            });
        } else {
            (groupForm as any).resetFields();
            (groupForm as any).setFieldsValue({ isActive: true, minSelectCount: 0, maxSelectCount: 1, modifierItems: [] });
        }
        setIsGroupModalOpen(true);
    };

    const modColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <b>{t}</b> },
        { title: 'Description', dataIndex: 'description', key: 'desc' },
        { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `${currencySymbol} ${v.toFixed(2)}` },
        {
            title: 'Created At', dataIndex: 'createdOnUtc', key: 'createdAt', width: 160,
            render: (v: string) => v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
        },
        {
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: Modifier) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModifierModal(r)} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteModifier(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteMod.isPending} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const groupColumns = [
        { title: 'Group Name', dataIndex: 'name', key: 'name', render: (t: string) => <b>{t}</b> },
        { title: 'Description', dataIndex: 'description', key: 'desc' },
        {
            title: 'Select Constraints', key: 'constraints',
            render: (_: any, r: ModifierGroup) => (
                <Tag color="blue">Min: {r.minSelectCount} / Max: {r.maxSelectCount}</Tag>
            )
        },
        {
            title: 'Modifiers', key: 'items',
            render: (_: any, r: ModifierGroup) => (
                <Tag>{r.modifierItems?.length || 0} items</Tag>
            )
        },
        {
            title: 'Status', dataIndex: 'isActive', key: 'active',
            render: (act: boolean) => act ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>
        },
        {
            title: 'Created At', dataIndex: 'createdOnUtc', key: 'createdAt', width: 160,
            render: (v: string) => v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
        },
        {
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: ModifierGroup) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openGroupModal(r)} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteGroup(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteGroup.isPending} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const modFilterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search modifiers…"
                prefix={<SearchOutlined />}
                value={modSearch}
                onChange={e => { setModSearch(e.target.value); setModPage(1); }}
                style={{ maxWidth: 260 }}
                allowClear
            />
        </div>
    );

    const groupFilterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search groups…"
                prefix={<SearchOutlined />}
                value={groupSearch}
                onChange={e => { setGroupSearch(e.target.value); setGroupPage(1); }}
                style={{ maxWidth: 260 }}
                allowClear
            />
        </div>
    );

    return (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Modifier Management</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => activeTab === 'modifiers' ? openModifierModal() : openGroupModal()}
                >
                    {activeTab === 'modifiers' ? 'New Modifier' : 'New Group'}
                </Button>
            </div>

            <Card styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }} style={{ flex: 1, overflow: 'hidden', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    tabBarStyle={{ margin: 0, padding: '10px 10px 0', background: token.colorFillAlter, flexShrink: 0 }}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    className="full-height-tabs"
                    items={[
                        {
                            key: 'modifiers',
                            label: <span><UnorderedListOutlined /> All Modifiers</span>,
                            children: (
                                <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                                    <RichTable<Modifier>
                                        data={isLoadingModifiers ? MOD_SKELETON_DATA : paginatedModifiers}
                                        columns={isLoadingModifiers ? MOD_SKELETON_COLUMNS : modColumns}
                                        rowKey="id"
                                        isLoading={false}
                                        currentPage={modPage}
                                        pageSize={modPageSize}
                                        totalItems={filteredModifiers.length}
                                        onPageChange={setModPage}
                                        onPageSizeChange={s => { setModPageSize(s); setModPage(1); }}
                                        filterBar={modFilterBar}
                                        totalLabel="modifiers"
                                        scrollY="calc(100vh - 380px)"
                                    />
                                </div>
                            )
                        },
                        {
                            key: 'groups',
                            label: <span><AppstoreOutlined /> Modifier Groups</span>,
                            children: (
                                <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                                    <RichTable<ModifierGroup>
                                        data={isLoadingGroups ? GROUP_SKELETON_DATA : paginatedGroups}
                                        columns={isLoadingGroups ? GROUP_SKELETON_COLUMNS : groupColumns}
                                        rowKey="id"
                                        isLoading={false}
                                        currentPage={groupPage}
                                        pageSize={groupPageSize}
                                        totalItems={filteredGroups.length}
                                        onPageChange={setGroupPage}
                                        onPageSizeChange={s => { setGroupPageSize(s); setGroupPage(1); }}
                                        filterBar={groupFilterBar}
                                        quickFilters={isLoadingGroups ? undefined : groupQuickFilters}
                                        activeFilterKey={groupStatusFilter}
                                        onFilterChange={key => { setGroupStatusFilter(key); setGroupPage(1); }}
                                        totalLabel="groups"
                                        scrollY="calc(100vh - 380px)"
                                    />
                                </div>
                            )
                        }
                    ]}
                />
            </Card>

            <Modal
                title={editingModifier ? "Edit Modifier" : "Create Modifier"}
                open={isModModalOpen}
                onOk={handleSaveModifier}
                confirmLoading={createMod.isPending || updateMod.isPending}
                onCancel={() => setIsModModalOpen(false)}
            >
                <Form form={modForm} layout="vertical">
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="price" label="Additional Price" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={editingGroup ? "Edit Modifier Group" : "Create Modifier Group"}
                open={isGroupModalOpen}
                onOk={handleSaveGroup}
                confirmLoading={createGroup.isPending || updateGroup.isPending}
                onCancel={() => setIsGroupModalOpen(false)}
                width={800}
                mask={{ closable: false }}
            >
                <Form form={groupForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Pizza Toppings" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Description">
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="minSelectCount" label="Min Selections" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="maxSelectCount" label="Max Selections" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Assigned Modifiers">
                        <div style={{ background: token.colorFillAlter, padding: 16, borderRadius: 8 }}>
                            <Form.List name="modifierItems">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.length > 0 && (
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 8, marginLeft: 4 }}>
                                                <span style={{ flex: 3, fontWeight: 'bold' }}>Modifier Name</span>
                                                <span style={{ flex: 1, fontWeight: 'bold' }}>Qty</span>
                                                <span style={{ flex: 1, fontWeight: 'bold' }}>Min Qty</span>
                                                <span style={{ flex: 1, fontWeight: 'bold' }}>Max Qty</span>
                                                <span style={{ width: 14 }}></span>
                                            </div>
                                        )}
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, marginTop: 8, alignItems: 'center' }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'modifierId']}
                                                    rules={[{ required: true, message: 'Missing modifier' }]}
                                                    style={{ flex: 3, margin: 0 }}
                                                >
                                                    <Select
                                                        placeholder="Select Modifier"
                                                        showSearch
                                                        optionFilterProp="label"
                                                        options={allModifiers.map(m => ({
                                                            value: m.id,
                                                            label: `${m.name} (${currencySymbol} ${m.price.toFixed(2)})`
                                                        }))}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    initialValue={0}
                                                    style={{ flex: 1, margin: 0 }}
                                                >
                                                    <InputNumber placeholder="Default" min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'minQuantity']}
                                                    initialValue={0}
                                                    style={{ flex: 1, margin: 0 }}
                                                >
                                                    <InputNumber placeholder="Min Qty" min={0} style={{ width: '100%' }} />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'maxQuantity']}
                                                    initialValue={1}
                                                    style={{ flex: 1, margin: 0 }}
                                                >
                                                    <InputNumber placeholder="Max Qty" min={1} style={{ width: '100%' }} />
                                                </Form.Item>
                                                
                                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                            </div>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                                            Add Modifier to Group
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ModifierManagementView;