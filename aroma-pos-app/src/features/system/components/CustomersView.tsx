import React, { useState } from 'react';
import { Table, Button, Tag, Space, Typography, theme, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { UserAddOutlined, EditOutlined, TeamOutlined, PhoneOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { CustomerStatus } from '@/src/shared/enums';
import { Customer } from '../../../shared/types/system/Customer';

const { Title, Text } = Typography;
const { Option } = Select;

interface CustomersViewProps {
    customers: Customer[];
    userRole: string; 
    onSave: (customer: Customer) => Promise<void>;
    onStatusChange: (id: string, newStatus: CustomerStatus) => Promise<void>;
}

const CustomersView: React.FC<CustomersViewProps> = ({ customers, userRole, onSave, onStatusChange }) => {
    const { token } = theme.useToken();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [form] = Form.useForm();

    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin'; 

    const getStatusDetails = (status: CustomerStatus) => {
        switch (status) {
            case CustomerStatus.Active:
                return { color: '#52c41a', label: 'Active', tagColor: 'green' }; 
            case CustomerStatus.Inactive:
                return { color: '#faad14', label: 'Inactive', tagColor: 'warning' }; 
            case CustomerStatus.Blocked:
                return { color: '#ff4d4f', label: 'Blocked', tagColor: 'error' }; 
            default:
                return { color: '#d9d9d9', label: 'Unknown', tagColor: 'default' };
        }
    };

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <Tag icon={<IdcardOutlined />}>{text}</Tag>,
        },
        {
            title: 'Customer Name',
            key: 'name',
            render: (_: any, record: Customer) => (
                <span style={{ fontWeight: 500, color: token.colorText }}>
                    {record.firstName} {record.lastName}
                </span>
            ),
        },
        {
            title: 'Contact Info',
            key: 'contact',
            render: (_: any, record: Customer) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 13 }}><MailOutlined /> {record.email || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}><PhoneOutlined /> {record.phoneNumber}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: CustomerStatus, record: Customer) => {
                const details = getStatusDetails(status);
                return (
                    <Space>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: details.color }} />
                        {isAdmin ? (
                            <Popconfirm
                                title={`Are you sure you want to change this customer status to ${status === CustomerStatus.Active ? 'Inactive' : 'Active'}?`}
                                onConfirm={() => onStatusChange(record.id, status === CustomerStatus.Active ? CustomerStatus.Inactive : CustomerStatus.Active)}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Tag color={details.tagColor} style={{ cursor: 'pointer' }}>{details.label}</Tag>
                            </Popconfirm>
                        ) : (
                            <Tag color={details.tagColor}>{details.label}</Tag>
                        )}
                    </Space>
                ); 
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Customer) => (
                <Space size="small">
                    <Button 
                        type="text" 
                        icon={<EditOutlined style={{ color: token.colorPrimary }} />} 
                        onClick={() => {
                            setEditingCustomer(record);
                            form.setFieldsValue(record);
                            setIsModalOpen(true);
                        }}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ height: '100%', padding: 24, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Customer Management</Title>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
                    setEditingCustomer(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}>
                    Add Customer
                </Button>
            </div>

            <div style={{ background: token.colorBgContainer, borderRadius: 8, overflow: 'hidden', border: `1px solid ${token.colorBorder}` }}>
                <Table 
                    className="custom-table" 
                    dataSource={customers} 
                    columns={columns} 
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </div>

            <Modal
                title={editingCustomer ? "Update Customer" : "Add New Customer"}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={(v) => onSave({...v, id: editingCustomer?.id})}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                            <Input placeholder="John" />
                        </Form.Item>
                        <Form.Item name="lastName" label="Last Name">
                            <Input placeholder="Doe" />
                        </Form.Item>
                    </div>

                    {editingCustomer && (
                        <Form.Item name="code" label="Customer Code">
                            <Input disabled />
                        </Form.Item>
                    )}
                    <Form.Item name="email" label="Email Address" rules={[{ type: 'email' }]}>
                        <Input placeholder="email@example.com" />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
                        <Input placeholder="+94..." />
                    </Form.Item>
                    <Form.Item name="status" label="Customer Status" initialValue={CustomerStatus.Active}>
                        <Select disabled={!isAdmin}>
                            <Option value={CustomerStatus.Active}>Active</Option>
                            <Option value={CustomerStatus.Inactive}>Inactive</Option>
                            <Option value={CustomerStatus.Blocked}>Blocked</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CustomersView;