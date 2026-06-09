import React, { useState } from 'react';
import {
    Button, Space, Input, Modal, Typography, Popconfirm, message,
    Tag, Form, Select, InputNumber, Skeleton,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { UseMutationResult } from '@tanstack/react-query';
import { Device, DeviceType, DeviceProtocol } from '../../../shared/types';
import { DeviceStatusType, DeviceTypeEnum, CardProviderType } from '@/src/shared/enums';
import { RichTable } from '../../../shared/components/rich-table';

const { Title } = Typography;
const { Option } = Select;
const { useWatch } = Form;

interface DeviceViewProps {
    devices: Device[];
    deviceTypes: DeviceType[];
    protocols: DeviceProtocol[];
    isLoading?: boolean;
    createDevice: UseMutationResult<any, any, any, any>;
    updateDevice: UseMutationResult<any, any, any, any>;
    deleteDevice: UseMutationResult<any, any, any, any>;
}

const SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` }) as unknown as Device);
const SKELETON_COLUMNS: ColumnsType<Device> = [
    { key: 'name',      title: 'Name',       width: 220, render: () => <Skeleton.Input active size="small" style={{ width: 140 }} /> },
    { key: 'type',      title: 'Type',       width: 120, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'location',  title: 'Location',   width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'ip',        title: 'IP Address', width: 140, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'status',    title: 'Status',     width: 100, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'createdAt', title: 'Created At', width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 100 }} /> },
    { key: 'action',    title: 'Action',     width: 100, render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const DeviceView: React.FC<DeviceViewProps> = ({
    devices,
    deviceTypes,
    protocols,
    isLoading = false,
    createDevice,
    updateDevice,
    deleteDevice,
}) => {
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const selectedTypeId = useWatch('deviceTypeId', form);
    const isPax = deviceTypes.find(t => t.id === selectedTypeId)?.name === DeviceTypeEnum[DeviceTypeEnum.PAX];

    const isDeviceActive = (status: any, isActive?: boolean): boolean => {
        if (status !== undefined && status !== null && status !== '') {
            if (typeof status === 'number') return status === DeviceStatusType.Active;
            const s = String(status).toLowerCase();
            return s === 'active' || s === '1' || s === 'true';
        }
        if (isActive !== undefined) return isActive;
        return false;
    };

    const openModal = (device?: Device) => {
        setEditingDevice(device || null);
        if (device) {
            let statusVal: any = device.status;
            if (typeof statusVal === 'string') {
                const s = statusVal.toLowerCase();
                if (s === 'active') statusVal = DeviceStatusType.Active;
                else statusVal = DeviceStatusType.InActive;
            }
            form.setFieldsValue({
                ...device,
                deviceTypeId: device.type?.id,
                deviceProtocolId: device.protocol?.id,
                status: statusVal,
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: DeviceStatusType.Active });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (!isPax) values.provider = undefined;
            
            // Map numeric dropdown select value back to string if needed
            if (values.status === DeviceStatusType.Active) {
                values.status = 'Active';
            } else {
                values.status = 'InActive';
            }

            if (editingDevice) {
                await updateDevice.mutateAsync({ id: editingDevice.id, data: values });
                message.success('Device updated');
            } else {
                await createDevice.mutateAsync(values);
                message.success('Device created');
            }
            setIsModalOpen(false);
        } catch {
            message.error('Failed to save device');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDevice.mutateAsync(id);
            message.success('Device deleted');
        } catch {
            message.error('Failed to delete device');
        }
    };

    const filtered = React.useMemo(() => {
        return devices.filter(d => {
            if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
                !(d.location || '').toLowerCase().includes(search.toLowerCase())) return false;
            const isActive = isDeviceActive(d.status, d.isActive);
            if (statusFilter === 'active' && !isActive) return false;
            if (statusFilter === 'inactive' && isActive) return false;
            return true;
        });
    }, [devices, search, statusFilter]);

    const paginated = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    const quickFilters = React.useMemo(() => {
        const all = devices.length;
        const active = devices.filter(d => isDeviceActive(d.status, d.isActive)).length;
        return [
            { key: 'all',      label: 'All',      count: all },
            { key: 'active',   label: 'Active',   count: active },
            { key: 'inactive', label: 'Inactive', count: all - active },
        ];
    }, [devices]);

    const columns: ColumnsType<Device> = [
        {
            title: 'Name', dataIndex: 'name', key: 'name', width: 220,
            render: (text: string, record: Device) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{text}</span>
                    {record.serialNumber && (
                        <span style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: '#8c8c8c',
                            background: '#f5f5f5',
                            borderRadius: 4,
                            padding: '1px 6px',
                            display: 'inline-block',
                            width: 'fit-content',
                            letterSpacing: '0.04em',
                        }}>
                            {record.serialNumber}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: 'Type', dataIndex: ['type', 'name'], key: 'type', width: 120,
            render: (text: string) => <Tag color="blue">{text || 'N/A'}</Tag>,
        },
        { title: 'Location', dataIndex: 'location', key: 'location', width: 160 },
        {
            title: 'IP Address', dataIndex: 'ipAddress', key: 'ip', width: 140,
            render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text || '—'}</span>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 100,
            render: (v: DeviceStatusType, record: Device) => {
                const isActive = isDeviceActive(v, record.isActive);
                return isActive
                    ? <Tag color="green">Active</Tag>
                    : <Tag color="red">Inactive</Tag>;
            }
        },
        {
            title: 'Created At', dataIndex: 'createdOnUtc', key: 'createdAt', width: 160,
            render: (v: string) => v
                ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                : '—',
        },
        {
            title: 'Action', key: 'action', width: 100,
            render: (_: any, r: Device) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
                    <Popconfirm title="Delete this device?" onConfirm={() => handleDelete(r.id)}>
                        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteDevice.isPending} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search devices…"
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
                <Title level={2} style={{ margin: 0 }}>Device Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    New Device
                </Button>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <RichTable<Device>
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
                    totalLabel="devices"
                    scrollY="calc(100vh - 320px)"
                />
            </div>

            <Modal
                title={editingDevice ? 'Edit Device' : 'Add Device'}
                open={isModalOpen}
                onOk={handleSave}
                confirmLoading={createDevice.isPending || updateDevice.isPending}
                onCancel={() => setIsModalOpen(false)}
                width={600}
            >
                <Form form={form} name="device_form" layout="vertical" style={{ marginTop: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <Form.Item name="name" label="Device Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. POS 1" />
                        </Form.Item>
                        <Form.Item name="deviceTypeId" label="Device Type" rules={[{ required: true }]}>
                            <Select placeholder="Select type">
                                {deviceTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value={DeviceStatusType.Active}>Active</Option>
                                <Option value={DeviceStatusType.InActive}>Inactive</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="deviceProtocolId" label="Protocol">
                            <Select placeholder="Select protocol" allowClear>
                                {protocols.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="location" label="Location">
                            <Input placeholder="e.g. Counter A" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="ipAddress" label="IP Address">
                            <Input placeholder="192.168.1.xxx" />
                        </Form.Item>
                        <Form.Item name="port" label="Port">
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="serialNumber" label="Serial Number" rules={[{ required: true }]}>
                            <Input placeholder="e.g. SN-2025-AX94" />
                        </Form.Item>
                        <Form.Item
                            name="provider"
                            label={<span style={{ opacity: isPax ? 1 : 0.4 }}>Provider</span>}
                        >
                            <Select placeholder="Select provider" disabled={!isPax} allowClear>
                                <Option value={CardProviderType.HNB}>HNB</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DeviceView;
