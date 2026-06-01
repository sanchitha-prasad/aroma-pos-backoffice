import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Typography, theme, Popconfirm, Form, Select, Tag, Tabs, InputNumber, TimePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Branch } from '../../../shared/types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const { Option } = Select;

interface BranchViewProps {
    branches: Branch[];
    onSave: (branch: Branch) => void;
    onDelete: (id: string) => void;
}
const { Title } = Typography;

const BranchView: React.FC<BranchViewProps> = ({ branches, onSave, onDelete }) => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [form] = Form.useForm();

    const showModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            (form as any).setFieldsValue({
                ...branch,
                operationTimes: [
                    branch.configuration.operationStartOnUtc ? dayjs(branch.configuration.operationStartOnUtc) : null,
                    branch.configuration.operationEndOnUtc ? dayjs(branch.configuration.operationEndOnUtc) : null
                ]
            });
        } else {
            setEditingBranch(null);
            (form as any).resetFields();
            (form as any).setFieldsValue({ 
                isActive: true,
                // address: { country: 'USA' } 
            });
        }
        setIsModalVisible(true);
    };

    const handleOk = () => {
        (form as any).validateFields().then((values: any) => {
            const { operationTimes, ...rest } = values;
            
            const newBranch: Branch = {
                id: editingBranch ? editingBranch.id : '',
                name: values.name,
                code: values.code,
                phoneNumber: values.phoneNumber,
                email: values.email,
                isActive: values.isActive,
                address: values.address,
                configuration: {
                    maxFloors: values.configuration?.maxFloors || 1,
                    operationStartOnUtc: operationTimes ? operationTimes[0].toISOString() : '',
                    operationEndOnUtc: operationTimes ? operationTimes[1].toISOString() : ''
                }
            };
            onSave(newBranch);
            setIsModalVisible(false);
        });
    };

    const columns = [
        { 
            title: 'Code', 
            dataIndex: 'code', 
            key: 'code',
            render: (text: string) => <Tag>{text}</Tag>
        },
        { 
            title: 'Branch Name', 
            dataIndex: 'name', 
            key: 'name',
            render: (text: string) => (
                <Space>
                    <ShopOutlined style={{ color: token.colorPrimary }} />
                    <strong style={{ color: token.colorText }}>{text}</strong>
                </Space>
            )
        },
        { 
            title: 'City/Location', 
            dataIndex: ['address', 'city'], 
            key: 'city',
            render: (text: string, record: Branch) => (
                <Space>
                    <EnvironmentOutlined style={{ color: token.colorTextSecondary }} />
                    {/* <span>{text}, {record.address.country}</span> */}
                </Space>
            )
        },
        { 
            title: 'Phone', 
            dataIndex: 'phoneNumber', 
            key: 'phone',
            render: (text: string) => (
                <Space>
                    <PhoneOutlined style={{ color: token.colorTextSecondary }} />
                    <span style={{ fontFamily: 'monospace' }}>{text}</span>
                </Space>
            )
        },
        { 
            title: 'Status', 
            dataIndex: 'isActive', 
            key: 'isActive',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '120px',
            render: (_: any, record: Branch) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: token.colorPrimary }} />} onClick={() => showModal(record)} />
                    <Popconfirm title="Delete Branch?" description="This action cannot be undone." onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined style={{ color: 'red' }} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Branch Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                    Add Branch
                </Button>
            </div>

            <div style={{ background: token.colorBgContainer, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                 <Table 
                    className="custom-table" 
                    dataSource={branches} 
                    columns={columns} 
                    rowKey="id" 
                    pagination={{ pageSize: 10 }} 
                 />
            </div>

            <Modal 
                title={editingBranch ? "Edit Branch" : "Add Branch"} 
                open={isModalVisible} 
                onOk={handleOk} 
                onCancel={() => setIsModalVisible(false)}
                width={700}
                mask={{ closable: false }}
            >
                <Form form={form} layout="vertical">
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: <span><ShopOutlined /> General Info</span>,
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                                        <Form.Item name="code" label="Branch Code" rules={[{ required: true }]}>
                                            <Input placeholder="BR001" />
                                        </Form.Item>
                                        <Form.Item name="name" label="Branch Name" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. Downtown HQ" />
                                        </Form.Item>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
                                            <Input placeholder="+1 555 000 0000" />
                                        </Form.Item>
                                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                            <Input placeholder="branch@aromapos.com" />
                                        </Form.Item>
                                    </div>
                                    <Form.Item name="isActive" label="Status" rules={[{ required: true }]}>
                                        <Select>
                                            <Option value={true}>Active</Option>
                                            <Option value={false}>Inactive</Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: <span><EnvironmentOutlined /> Location</span>,
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    <Form.Item name={['address', 'addressLine1']} label="Address Line 1" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name={['address', 'addressLine2']} label="Address Line 2" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name={['address', 'city']} label="City" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name={['address', 'state']} label="State/Province" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                    </div>
                                    {/* <Form.Item name={['address', 'country']} label="Country" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item> */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <Form.Item name={['address', 'latitude']} label="Latitude" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. 6.9271" />
                                        </Form.Item>
                                        <Form.Item name={['address', 'longitude']} label="Longitude" rules={[{ required: true }]}>
                                            <Input placeholder="e.g. 79.8612" />
                                        </Form.Item>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: <span><SettingOutlined /> Configuration</span>,
                            children: (
                                <div style={{ paddingTop: 12 }}>
                                    <Form.Item name={['configuration', 'maxFloors']} label="Max Floors" rules={[{ required: true }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                    <Form.Item name="operationTimes" label="Operating Hours (UTC)" rules={[{ required: true }]}>
                                        <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
                                    </Form.Item>
                                </div>
                            )
                        }
                    ]} />
                </Form>
            </Modal>
        </div>
    );
};

export default BranchView;