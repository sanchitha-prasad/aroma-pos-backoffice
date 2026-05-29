import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Input, Modal, Typography,
    theme, Popconfirm, message, InputNumber, Form, Tabs, List, Select, Row, Col, Tag, Switch
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    AppstoreOutlined, UnorderedListOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import { Modifier, ModifierGroup, ModifierItem } from '../../../shared/types';
import { ModifiersService } from '../api/modifiers.service';
import Card from 'antd/es/card/Card';
import { Option } from 'antd/es/mentions';
import { ModifierGroupsService } from '../api/ModifierGroups.service';

const { Title, Text } = Typography;

interface ModifierManagementViewProps {
    allModifiers: Modifier[];
    allGroups: ModifierGroup[];
    onModifierChange: () => void;
}

const ModifierManagementView: React.FC<ModifierManagementViewProps> = ({ allModifiers, allGroups, onModifierChange }) => {
    const { token } = theme.useToken();
    const [activeTab, setActiveTab] = useState('modifiers');

    const [isModModalOpen, setIsModModalOpen] = useState(false);
    const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
    const [modForm] = Form.useForm();

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
    const [groupForm] = Form.useForm();

    const handleSaveModifier = async () => {
        try {
            const values = await (modForm as any).validateFields();
            if (editingModifier) {
                await ModifiersService.updateModifier(editingModifier.id, values);
                message.success('Modifier updated');
            } else {
                await ModifiersService.createModifier(values);
                message.success('Modifier created');
            }
            setIsModModalOpen(false);
            onModifierChange();
        } catch (error) {
            message.error('Failed to save modifier');
        }
    };

    const handleDeleteModifier = async (id: string) => {
        try {
            await ModifiersService.deleteModifier(id);
            message.success('Modifier deleted');
            onModifierChange();
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
                await ModifierGroupsService.updateModifierGroup(editingGroup.id, payload);
                message.success('Group updated');
            } else {
                await ModifierGroupsService.createModifierGroup(payload);
                message.success('Group created');
            }
            setIsGroupModalOpen(false);
            onModifierChange();
        } catch (error) {
            console.error(error);
            message.error('Failed to save group');
        }
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            await ModifierGroupsService.deleteModifierGroup(id);
            message.success('Group deleted');
            onModifierChange();
        } catch (error) {
            message.error('Failed to delete group');
        }
    };

    const openGroupModal = (group?: ModifierGroup) => {
        setEditingGroup(group || null);
        if (group) {
            (groupForm as any).setFieldsValue({
                ...group,
                modifierItems: group.modifierItems.map(item => ({
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
        { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `$${v.toFixed(2)}` },
        {
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: Modifier) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModifierModal(r)} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteModifier(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
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
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: ModifierGroup) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openGroupModal(r)} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDeleteGroup(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>Modifier Management</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => activeTab === 'modifiers' ? openModifierModal() : openGroupModal()}
                >
                    {activeTab === 'modifiers' ? 'New Modifier' : 'New Group'}
                </Button>
            </div>

            <Card styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden', borderRadius: 8 }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    tabBarStyle={{ margin: 0, padding: '10px 10px 0', background: token.colorFillAlter }}
                    items={[
                        {
                            key: 'modifiers',
                            label: <span><UnorderedListOutlined /> All Modifiers</span>,
                            children: <Table dataSource={allModifiers} columns={modColumns} rowKey="id" pagination={{ pageSize: 8 }} />
                        },
                        {
                            key: 'groups',
                            label: <span><AppstoreOutlined /> Modifier Groups</span>,
                            children: <Table dataSource={allGroups} columns={groupColumns} rowKey="id" pagination={{ pageSize: 8 }} />
                        }
                    ]}
                />
            </Card>

            <Modal
                title={editingModifier ? "Edit Modifier" : "Create Modifier"}
                open={isModModalOpen}
                onOk={handleSaveModifier}
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
                                                {/* Spacer for the delete icon to keep alignment correct */}
                                                <span style={{ width: 14 }}></span>
                                            </div>
                                        )}
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8,marginTop:8, alignItems: 'center' }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'modifierId']}
                                                    rules={[{ required: true, message: 'Missing modifier' }]}
                                                    style={{ flex: 3, margin: 0 }}
                                                >
                                                    <Select placeholder="Select Modifier" showSearch optionFilterProp="children">
                                                        {allModifiers.map(m => (
                                                            <Option key={m.id} value={m.id}>{m.name} (${m.price})</Option>
                                                        ))}
                                                    </Select>
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