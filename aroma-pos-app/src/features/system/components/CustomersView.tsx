import React, { useEffect, useMemo, useState } from 'react';
import {
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
    Empty,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    UserAddOutlined,
    EditOutlined,
    PhoneOutlined,
    MailOutlined,
    IdcardOutlined,
    DownOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { CustomerStatus } from '@/src/shared/enums';
import type { Customer } from '../../../shared/types/system/Customer';
import RichTable from '../../../shared/components/rich-table/RichTable';
import StatusDot from '../../../shared/components/rich-table/StatusDot';
import type { StatusDotVariant } from '../../../shared/components/rich-table/StatusDot';

const { Title } = Typography;
const { Option } = Select;

interface CustomersViewProps {
    customers: Customer[];
    loading?: boolean;
    userRole: string;
    onSave: (customer: Customer) => Promise<void>;
    onStatusChange: (id: string, newStatus: CustomerStatus) => Promise<void>;
}

const STATUS_META: Record<
    CustomerStatus,
    { dotVariant: StatusDotVariant; label: string; tagColor: string }
> = {
    [CustomerStatus.Active]: { dotVariant: 'success', label: 'Active', tagColor: 'green' },
    [CustomerStatus.Inactive]: { dotVariant: 'warning', label: 'Inactive', tagColor: 'warning' },
    [CustomerStatus.Blocked]: { dotVariant: 'error', label: 'Blocked', tagColor: 'error' },
};

const FILTER_ALL = 'all';

const CustomersView: React.FC<CustomersViewProps> = ({
    customers,
    loading = false,
    userRole,
    onSave,
    onStatusChange,
}) => {
    const { token } = theme.useToken();
    const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

    // ── Pagination ───────────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // ── Filters ───────────────────────────────────────────────────────────────
    const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
    const [search, setSearch] = useState('');

    // ── Add / Edit modal ──────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    // ── Status change confirmation modal ─────────────────────────────────────
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [pendingStatus, setPendingStatus] = useState<CustomerStatus | null>(null);

    useEffect(() => {
        if (isModalOpen && editingCustomer) {
            form.setFieldsValue({
                firstName: editingCustomer.firstName,
                lastName: editingCustomer.lastName,
                code: editingCustomer.code,
                email: editingCustomer.email,
                phoneNumber: editingCustomer.phoneNumber,
                status: editingCustomer.status,
            });
        } else if (isModalOpen && !editingCustomer) {
            form.resetFields();
        }
    }, [isModalOpen, editingCustomer, form]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let result = customers;

        if (activeFilter !== FILTER_ALL) {
            const statusNum = parseInt(activeFilter, 10) as CustomerStatus;
            result = result.filter((c) => c.status === statusNum);
        }

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(
                (c) =>
                    `${c.firstName} ${c.lastName ?? ''}`.toLowerCase().includes(q) ||
                    (c.email ?? '').toLowerCase().includes(q) ||
                    c.phoneNumber.includes(q) ||
                    c.code.toLowerCase().includes(q),
            );
        }

        return result;
    }, [customers, activeFilter, search]);

    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filtered, currentPage, pageSize],
    );

    const handleFilterChange = (key: string) => {
        setActiveFilter(key);
        setCurrentPage(1);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    // ── Quick filter counts ───────────────────────────────────────────────────
    const quickFilters = [
        { key: FILTER_ALL, label: 'All', count: customers.length },
        {
            key: String(CustomerStatus.Active),
            label: 'Active',
            count: customers.filter((c) => c.status === CustomerStatus.Active).length,
        },
        {
            key: String(CustomerStatus.Inactive),
            label: 'Inactive',
            count: customers.filter((c) => c.status === CustomerStatus.Inactive).length,
        },
        {
            key: String(CustomerStatus.Blocked),
            label: 'Blocked',
            count: customers.filter((c) => c.status === CustomerStatus.Blocked).length,
        },
    ];

    // ── Handlers ──────────────────────────────────────────────────────────────
    const openAddModal = () => {
        setEditingCustomer(null);
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

    const handleFinish = async (values: any) => {
        try {
            setSaving(true);
            await onSave({
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
            });
            closeModal();
        } finally {
            setSaving(false);
        }
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columns: ColumnsType<Customer> = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
            width: 120,
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
                <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 13 }}>
                        <MailOutlined style={{ marginRight: 4 }} />
                        {record.email || 'N/A'}
                    </span>
                    <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
                        <PhoneOutlined style={{ marginRight: 4 }} />
                        {record.phoneNumber}
                    </span>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: CustomerStatus, record: Customer) => {
                const meta = STATUS_META[status] ?? { dotVariant: 'default', label: 'Unknown', tagColor: 'default' };

                const statusMenuItems: MenuProps['items'] = [
                    { key: String(CustomerStatus.Active), label: 'Active', disabled: status === CustomerStatus.Active },
                    { key: String(CustomerStatus.Inactive), label: 'Inactive', disabled: status === CustomerStatus.Inactive },
                    { key: String(CustomerStatus.Blocked), label: 'Blocked', disabled: status === CustomerStatus.Blocked },
                ];

                return isAdmin ? (
                    <Dropdown
                        trigger={['click']}
                        menu={{
                            items: statusMenuItems,
                            onClick: ({ key, domEvent }) => {
                                domEvent.stopPropagation();
                                const s = parseInt(key, 10) as CustomerStatus;
                                if (s !== status) handleStatusClick(record, s);
                            },
                        }}
                    >
                        <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <StatusDot variant={meta.dotVariant} label={meta.label} />
                            <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                        </span>
                    </Dropdown>
                ) : (
                    <StatusDot variant={meta.dotVariant} label={meta.label} />
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            render: (_: any, record: Customer) => (
                <Button
                    type="text"
                    icon={<EditOutlined style={{ color: token.colorPrimary }} />}
                    onClick={() => openEditModal(record)}
                    title="Edit"
                />
            ),
        },
    ];

    // ── Filter bar ────────────────────────────────────────────────────────────
    const filterBar = (
        <Input
            prefix={<SearchOutlined style={{ color: token.colorTextPlaceholder }} />}
            placeholder="Search by name, email, phone or code…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 340 }}
        />
    );

    return (
        <div style={{ height: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Customer Management</Title>
                <Button type="primary" icon={<UserAddOutlined />} onClick={openAddModal}>
                    Add Customer
                </Button>
            </div>

            {/* ── Table ── */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <RichTable<Customer>
                    data={paginated}
                    columns={columns}
                    rowKey="id"
                    isLoading={loading}
                    quickFilters={quickFilters}
                    activeFilterKey={activeFilter}
                    onFilterChange={handleFilterChange}
                    filterBar={filterBar}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                    totalLabel="customers"
                    scrollY="calc(100vh - 320px)"
                />
            </div>

            {/* ── Status confirmation modal ── */}
            <Modal
                title="Confirm Status Change"
                open={statusModalOpen}
                onOk={confirmStatusChange}
                onCancel={cancelStatusChange}
            >
                <p>Are you sure you want to change this customer&apos;s status?</p>
            </Modal>

            {/* ── Add / Edit modal ── */}
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
                                    if (!value?.trim()) return Promise.reject(new Error('Phone number is required'));
                                    const normalized = value.replace(/[\s\-()]/g, '');
                                    if (!/^\+?[1-9]\d{9,14}$/.test(normalized)) {
                                        return Promise.reject(new Error('Phone number must be a valid international number.'));
                                    }
                                    return Promise.resolve();
                                },
                            },
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
