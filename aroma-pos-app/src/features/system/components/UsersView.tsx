import React, { useState, useMemo } from 'react';
import { Button, Tag, Space, Typography, theme, Modal, Form, Input, Select, Popconfirm, Timeline, Empty } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined, NumberOutlined, HistoryOutlined, ShopOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Employee, Branch } from '../../../shared/types';
import RichTable from '../../../shared/components/rich-table/RichTable';

const { Text } = Typography;
const { Option } = Select;

interface EmployeesViewProps {
    branches: Branch[];
    employees: Employee[];
    isLoading?: boolean;
    onSave: (emp: Employee) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ branches, employees, isLoading = false, onSave, onDelete }) => {
    const { token } = theme.useToken();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [selectedUserForActivity, setSelectedUserForActivity] = useState<Employee | null>(null);
    const [form] = Form.useForm();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const quickFilters = [
        { key: 'all', label: 'All', count: employees.length },
        { key: 'Active', label: 'Active', count: employees.filter(e => e.status === 'Active').length },
        { key: 'Inactive', label: 'Inactive', count: employees.filter(e => e.status === 'Inactive').length },
    ];

    const filtered = useMemo(() => {
        return employees.filter(e => {
            if (statusFilter !== 'all' && e.status !== statusFilter) return false;
            if (roleFilter && e.role !== roleFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
            }
            return true;
        });
    }, [employees, statusFilter, roleFilter, search]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleFilterChange = (key: string) => {
        setStatusFilter(key);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1); };

    const showModal = (employee?: Employee) => {
        if (employee) {
            setEditingEmployee(employee);
            form.setFieldsValue(employee);
        } else {
            setEditingEmployee(null);
            form.resetFields();
            form.setFieldsValue({ status: 'Active', role: 'Cashier' });
        }
        setIsModalOpen(true);
    };

    const showActivityModal = (employee: Employee) => {
        setSelectedUserForActivity(employee);
        setIsActivityModalOpen(true);
    };

    const handleOk = () => {
        form.validateFields().then((values) => {
            const emp: Employee = {
                id: editingEmployee ? editingEmployee.id : '',
                ...values,
            };
            onSave(emp);
            setIsModalOpen(false);
        });
    };

    const getBranchName = (branchId?: string) => {
        if (!branchId) return <span style={{ color: '#ccc' }}>Not Assigned</span>;
        const b = branches.find(br => br.id === branchId);
        return b ? b.name : <span style={{ color: '#ccc' }}>Unknown</span>;
    };

    const columns: ColumnsType<Employee> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <span style={{ fontWeight: 500, color: token.colorText }}>{text}</span>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Branch',
            dataIndex: 'branchId',
            key: 'branchId',
            render: (branchId: string) => (
                <Space size={4}>
                    <ShopOutlined style={{ color: token.colorTextSecondary }} />
                    {getBranchName(branchId)}
                </Space>
            ),
        },
        {
            title: 'POS Login',
            dataIndex: 'loginNumber',
            key: 'loginNumber',
            render: (num: string) => <Tag icon={<NumberOutlined />} variant="filled">{num}</Tag>,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const color = role === 'SuperAdmin' ? 'red' : role === 'Admin' ? 'purple' : role === 'Manager' ? 'blue' : 'default';
                return <Tag color={color}>{role}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Space>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: status === 'Active' ? '#52c41a' : '#d9d9d9' }} />
                    <span>{status}</span>
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Employee) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<HistoryOutlined style={{ color: token.colorInfo }} />}
                        onClick={() => showActivityModal(record)}
                        title="View History"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: token.colorPrimary }} />}
                        onClick={() => showModal(record)}
                        title="Edit"
                    />
                    <Popconfirm title="Delete employee?" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} title="Delete" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filterBar = (
        <Space size={12} wrap>
            <Input
                placeholder="Search by name or email"
                prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ width: 240 }}
                allowClear
            />
            <Select
                placeholder="All Roles"
                value={roleFilter}
                onChange={v => { setRoleFilter(v); setCurrentPage(1); }}
                allowClear
                style={{ width: 150 }}
            >
                <Option value="SuperAdmin">Super Admin</Option>
                <Option value="Admin">Admin</Option>
                <Option value="Manager">Manager</Option>
                <Option value="Cashier">Cashier</Option>
                <Option value="Waiter">Waiter</Option>
                <Option value="Kitchen">Kitchen</Option>
            </Select>
        </Space>
    );

    return (
        <div style={{ height: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 22, fontWeight: 600, color: token.colorText }}>Staff Management</span>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => showModal()}>Add Employee</Button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                <RichTable<Employee>
                    data={paginated}
                    columns={columns}
                    rowKey="id"
                    isLoading={isLoading}
                    quickFilters={quickFilters}
                    activeFilterKey={statusFilter}
                    onFilterChange={handleFilterChange}
                    filterBar={filterBar}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    totalLabel="employees"
                />
            </div>

            <Modal
                title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
            >
                <Form form={form} name="user_form" layout="vertical">
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. John Doe" />
                    </Form.Item>
                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="john@restaurant.com" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password is required' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="******" />
                        </Form.Item>
                        <Form.Item name="loginNumber" label="POS Login PIN" rules={[{ required: true, message: 'Login PIN is required' }]}>
                            <Input prefix={<NumberOutlined />} placeholder="e.g. 1001" maxLength={6} />
                        </Form.Item>
                    </div>

                    <Form.Item name="branchId" label="Assigned Branch" rules={[{ required: true }]}>
                        <Select placeholder="Select a branch">
                            {branches.map(b => (
                                <Option key={b.id} value={b.id}>{b.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                            <Select>
                                <Option value="SuperAdmin">Super Admin</Option>
                                <Option value="Admin">Admin</Option>
                                <Option value="Manager">Manager</Option>
                                <Option value="Cashier">Cashier</Option>
                                <Option value="Waiter">Waiter</Option>
                                <Option value="Kitchen">Kitchen</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="Active">Active</Option>
                                <Option value="Inactive">Inactive</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HistoryOutlined />
                        <span>Activity History: {selectedUserForActivity?.name}</span>
                    </div>
                }
                open={isActivityModalOpen}
                footer={null}
                onCancel={() => setIsActivityModalOpen(false)}
                width={600}
                styles={{ body: { maxHeight: '60vh', overflowY: 'auto', padding: '24px' } }}
            >
                <Empty description="No recent activity found for this user." />
            </Modal>
        </div>
    );
};

export default EmployeesView;
