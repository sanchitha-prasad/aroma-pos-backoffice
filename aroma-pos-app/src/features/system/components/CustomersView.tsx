import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Tag,
    Space,
    Typography,
    theme,
    Modal,
    Form,
    Input,
    Select,
    Dropdown,
    MenuProps,
    Empty
} from 'antd';
import {
    UserAddOutlined,
    EditOutlined,
    PhoneOutlined,
    MailOutlined,
    IdcardOutlined,
    DownOutlined
} from '@ant-design/icons';
import { CustomerStatus } from '@/src/shared/enums';
import { Customer } from '../../../shared/types/system/Customer';

const { Title, Text } = Typography;
const { Option } = Select;

interface CustomersViewProps {
    customers: Customer[];
    loading?: boolean;
    userRole: string;
    onSave: (customer: Customer) => Promise<void>;
    onStatusChange: (id: string, newStatus: CustomerStatus) => Promise<void>;
}

const CustomersView: React.FC<CustomersViewProps> = ({
    customers,
    loading = false,
    userRole,
    onSave,
    onStatusChange
}) => {
    const { token } = theme.useToken();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

    useEffect(() => {
        if (isModalOpen && editingCustomer) {
            form.setFieldsValue({
                firstName: editingCustomer.firstName,
                lastName: editingCustomer.lastName,
                code: editingCustomer.code,
                email: editingCustomer.email,
                phoneNumber: editingCustomer.phoneNumber,
                status: editingCustomer.status
            });
        } else if (isModalOpen && !editingCustomer) {
            form.resetFields();
        }
    }, [isModalOpen, editingCustomer, form]);

    const openAddModal = () => {
        setEditingCustomer(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        form.resetFields();
    };

    const getStatusDetails = (status: CustomerStatus) => {
        switch (status) {
            case CustomerStatus.Active:
                return { dotColor: '#52c41a', label: 'Active', tagColor: 'green' };
            case CustomerStatus.Inactive:
                return { dotColor: '#faad14', label: 'Inactive', tagColor: 'warning' };
            case CustomerStatus.Blocked:
                return { dotColor: '#ff4d4f', label: 'Blocked', tagColor: 'error' };
            default:
                return { dotColor: '#d9d9d9', label: 'Unknown', tagColor: 'default' };
        }
    };

    ///////////////////////////////////////////
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [pendingStatus, setPendingStatus] = useState<CustomerStatus | null>(null);

    const handleStatusClick = (record: Customer, newStatus: CustomerStatus) => {
    setSelectedCustomer(record);
    setPendingStatus(newStatus);
    setStatusModalOpen(true);
};

const confirmStatusChange = async () => {
    if (!selectedCustomer || pendingStatus === null) return;

    await onStatusChange(selectedCustomer.id, pendingStatus);
    setStatusModalOpen(false);
    setSelectedCustomer(null);
    setPendingStatus(null);
};

const cancelStatusChange = () => {
    setStatusModalOpen(false);
    setSelectedCustomer(null);
    setPendingStatus(null);
};

    ///////////////////////////////////////////
    // const handleStatusClick = (record: Customer, newStatus: CustomerStatus) => {
    //     const details = getStatusDetails(newStatus);

    //     Modal.confirm({
    //         title: 'Confirm Status Change',
    //         content: `Are you sure you want to change this customer status to ${details.label}?`,
    //         okText: 'Yes',
    //         cancelText: 'No',
    //         onOk: async () => {
    //             await onStatusChange(record.id, newStatus);
    //         },
    //     });
    // };

    const handleFinish = async (values: any) => {
        try {
            setSaving(true);

            const customerToSave: Customer = {
                id: editingCustomer?.id || '',
                code: editingCustomer?.code || '',
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phoneNumber: values.phoneNumber,
                status: editingCustomer
                    ? (Number(values.status) as CustomerStatus)
                    : CustomerStatus.Active,
                createdOnUtc: editingCustomer?.createdOnUtc || '',
                updatedOnUtc: editingCustomer?.updatedOnUtc,
            };

            await onSave(customerToSave);
            closeModal();
        } finally {
            setSaving(false);
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
                    {[record.firstName, record.lastName].filter(Boolean).join(' ')}
                </span>
            ),
        },
        {
            title: 'Contact Info',
            key: 'contact',
            render: (_: any, record: Customer) => (
                <Space orientation="vertical" size={0}>
                    <Text style={{ fontSize: 13 }}>
                        <MailOutlined /> {record.email || 'N/A'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <PhoneOutlined /> {record.phoneNumber}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: CustomerStatus, record: Customer) => {
                const details = getStatusDetails(status);

                const statusMenuItems: MenuProps['items'] = [
                    {
                        key: String(CustomerStatus.Active),
                        label: 'Active',
                        disabled: status === CustomerStatus.Active
                    },
                    {
                        key: String(CustomerStatus.Inactive),
                        label: 'Inactive',
                        disabled: status === CustomerStatus.Inactive
                    },
                    {
                        key: String(CustomerStatus.Blocked),
                        label: 'Blocked',
                        disabled: status === CustomerStatus.Blocked
                    }
                ];

                return (
                    <Space>
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: details.dotColor
                            }}
                        />

                        {isAdmin ? (
                            <Dropdown
                                trigger={['click']}
                                menu={{
                                    items: statusMenuItems,
                                    onClick: ({ key, domEvent }) => {
                                        domEvent.stopPropagation();

                                        const selectedStatus = parseInt(key, 10) as CustomerStatus;

                                        if (selectedStatus !== status) {
                                            handleStatusClick(record, selectedStatus);
                                        }
                                    }
                                }}
                            >
                                <Tag
                                    color={details.tagColor}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        marginInlineEnd: 0
                                    }}
                                >
                                    {details.label} <DownOutlined style={{ fontSize: 10 }} />
                                </Tag>
                            </Dropdown>
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
                        onClick={() => openEditModal(record)}
                        title="Edit"
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ height: '100%', padding: 24, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Customer Management</Title>
                <Button type="primary" icon={<UserAddOutlined />} onClick={openAddModal}>
                    Add Customer
                </Button>
            </div>

            <div
                style={{
                    background: token.colorBgContainer,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `1px solid ${token.colorBorder}`
                }}
            >
                <Table
                    className="custom-table"
                    dataSource={customers}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{
                        emptyText: <Empty description="No customers found" />
                    }}
                />
            </div>

            <Modal
                title="Confirm Status Change"
                open={statusModalOpen}
                onOk={confirmStatusChange}
                onCancel={cancelStatusChange}
            >
                <p>
                    Are you sure you want to change this customer status?
                </p>
            </Modal>

            <Modal
                title={editingCustomer ? 'Update Customer' : 'Add New Customer'}
                open={isModalOpen}
                onOk={() => form.submit()}
                onCancel={closeModal}
                confirmLoading={saving}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item
                            name="firstName"
                            label="First Name"
                            rules={[{ required: true, message: 'First name is required' }]}
                        >
                            <Input placeholder="Marie" />
                        </Form.Item>

                        <Form.Item name="lastName" label="Last Name">
                            <Input placeholder="Curie" />
                        </Form.Item>
                    </div>

                    {editingCustomer && (
                        <Form.Item name="code" label="Customer Code">
                            <Input disabled />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[{ type: 'email', message: 'Enter a valid email address' }]}
                    >
                        <Input placeholder="email@example.com" />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Phone Number"
                        rules={[
                            { required: true, message: 'Phone number is required' },
                            {
                                validator: (_, value) => {
                                    if (!value || !value.trim()) {
                                        return Promise.reject(new Error('Phone number is required'));
                                    }

                                    const normalized = value.replace(/[\s\-()]/g, '');

                                    const phoneRegex = /^\+?[1-9]\d{9,14}$/;

                                    if (!phoneRegex.test(normalized)) {
                                        return Promise.reject(
                                            new Error('Phone number must be a valid international number.')
                                        );
                                    }

                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input placeholder="+94112345678" />
                    </Form.Item>

                    {editingCustomer && (
                        <Form.Item
                            name="status"
                            label="Customer Status"
                            rules={[{ required: true, message: 'Status is required' }]}
                        >
                            <Select disabled={!isAdmin}>
                                <Option value={CustomerStatus.Active}>Active</Option>
                                <Option value={CustomerStatus.Inactive}>Inactive</Option>
                                <Option value={CustomerStatus.Blocked}>Blocked</Option>
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default CustomersView;