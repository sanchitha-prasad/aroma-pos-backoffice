import React, { useState, useEffect } from 'react';

import {
    Table,
    Button,
    Space,
    Input,
    Modal,
    Typography,
    theme,
    Popconfirm,
    Form,
    Select,
    Tag,
    Tabs,
    InputNumber,
    TimePicker,
    Switch,
    Row,
    Col
} from 'antd';

import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ShopOutlined,
    ApartmentOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

import { Branch } from '../../../shared/types';
import { apiClient } from '../../../shared/services/api/client';
import dayjs from 'dayjs';
import BranchCatalogView from './BranchCatalogView';

const { Option } = Select;
const { Title } = Typography;

const DAYS = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 }
];

const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
};

const safe = (v: any) =>
    v === undefined || v === null || v === '' ? '' : String(v);

// =====================
// AVAILABILITY EDITOR
// =====================
const AvailabilityEditor: React.FC<{
    value: any[];
    onChange: (v: any[]) => void;
}> = ({ value, onChange }) => {
    const { token } = theme.useToken();

    const get = (d: number) =>
        value?.find(v => v.dayOfWeek === d);

    const toggle = (d: number, enabled: boolean) => {
        const current = value || [];

        if (enabled) {
            const exists = current.some(v => v.dayOfWeek === d);
            if (exists) return;

            onChange([
                ...current,
                {
                    dayOfWeek: d,
                    timePeriods: [
                        { startTime: '09:00:00', endTime: '22:00:00' }
                    ]
                }
            ]);
        } else {
            onChange(current.filter(v => v.dayOfWeek !== d));
        }
    };

    const updateTime = (d: number, start: string, end: string) => {
        onChange(
            (value || []).map(v =>
                v.dayOfWeek === d
                    ? { ...v, timePeriods: [{ startTime: start, endTime: end }] }
                    : v
            )
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAYS.map(d => {
                const entry = get(d.value);
                const active = !!entry;

                return (
                    <div
                        key={d.value}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            borderRadius: 8,
                            background: active
                                ? token.colorPrimaryBg
                                : token.colorFillQuaternary
                        }}
                    >
                        <Switch
                            checked={active}
                            onChange={v => toggle(d.value, v)}
                        />

                        <strong style={{ width: 50 }}>{d.label}</strong>

                        {active ? (
                            <TimePicker.RangePicker
                                style={{ width: '100%' }}
                                format="HH:mm"
                                value={[
                                    entry?.timePeriods?.[0]?.startTime
                                        ? dayjs(entry.timePeriods[0].startTime, 'HH:mm:ss')
                                        : null,
                                    entry?.timePeriods?.[0]?.endTime
                                        ? dayjs(entry.timePeriods[0].endTime, 'HH:mm:ss')
                                        : null
                                ]}
                                onChange={t => {
                                    if (t?.[0] && t?.[1]) {
                                        updateTime(
                                            d.value,
                                            t[0].format('HH:mm:ss'),
                                            t[1].format('HH:mm:ss')
                                        );
                                    }
                                }}
                            />
                        ) : (
                            <span style={{ opacity: 0.5 }}>Closed</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// =====================
// MAIN COMPONENT
// =====================
interface BranchViewProps {
    branches: Branch[];
    onSave: (branch: Branch) => void;
    onDelete: (id: string) => void;
}

const BranchView: React.FC<BranchViewProps> = ({
    branches,
    onSave,
    onDelete
}) => {
    const { token } = theme.useToken();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [catalogBranch, setCatalogBranch] = useState<Branch | null>(null);

    const [tenantSettings, setTenantSettings] = useState<Record<string, string>>({});

    const [form] = Form.useForm();
    const availabilities = Form.useWatch('availabilities', form) || [];

    // =====================
    // FETCH TENANT SETTINGS
    // =====================
    const fetchTenantSettings = async () => {
        try {
            const data = await apiClient.get<any[]>('/api/tenant-settings');
            const settings: Record<string, string> = {};
            (data || []).forEach((item: any) => {
                settings[item.key] = item.value;
            });

            setTenantSettings(settings);
            return settings;
        } catch (error) {
            console.error('Failed to load tenant settings', error);
            return {};
        }
    };

    useEffect(() => {
        fetchTenantSettings();
    }, []);

   const showModal = async (branch?: Branch) => {
    const settings = branch?.configuration?.settings ?? [];

    const getSetting = (key: string) =>
        settings.find(s => s.key === key)?.value;

    if (branch) {
        setEditingBranch(branch);

        form.setFieldsValue({
            ...branch,
            serviceCharge: getSetting('ServiceCharge'),
            merchantFeePercentage: getSetting('MerchantFeePercentage'),
            serviceChargeType: getSetting('ServiceChargeType'),
            isKdsAvailable: getSetting('IsKdsAvailable') === 'true',
            isExpeditorAvailable: getSetting('IsExpeditorAvailable') === 'true',
            posSessionTimeout: Number(getSetting('PosSessionTimeout')) || 0,
            timeZone: getSetting('TimeZone') || 'Asia/Colombo',
            currency: getSetting('Currency') || 'LKR',
            language: getSetting('Language') || 'English'
        });

        setIsModalVisible(true);
        return;
    }

    // ✅ WAIT FOR TENANT SETTINGS BEFORE OPENING NEW FORM
    let activeSettings = tenantSettings;
    if (!Object.keys(activeSettings).length) {
        activeSettings = await fetchTenantSettings();
    }

    setEditingBranch(null);
    form.resetFields();

    form.setFieldsValue({
        isActive: true,
        availabilities: [],

        serviceCharge: Number(activeSettings['ServiceCharge'] ?? 0),
        merchantFeePercentage: Number(activeSettings['MerchantFeePercentage'] ?? 0),
        serviceChargeType: activeSettings['ServiceChargeType'] ?? 'Percentage',

        isKdsAvailable: activeSettings['IsKdsAvailable'] === 'true',
        isExpeditorAvailable: activeSettings['IsExpeditorAvailable'] === 'true',

        posSessionTimeout: Number(activeSettings['PosSessionTimeout'] ?? 0),

        timeZone: activeSettings['DefaultTimeZone'] ?? 'Asia/Colombo',
        currency: activeSettings['DefaultCurrency'] ?? 'LKR',
        language: activeSettings['Language'] ?? 'English'
    });

    setIsModalVisible(true);
};

    const handleOk = () => {
        form.validateFields().then(values => {
            const branch: Branch = {
                id: editingBranch?.id ?? '',
                name: values.name,
                code: values.code,
                phoneNumber: values.phoneNumber,
                email: values.email,
                isActive: values.isActive,
                address: values.address,
                configuration: {
                    settings: [
                        { key: 'ServiceCharge', value: safe(values.serviceCharge) },
                        { key: 'MerchantFeePercentage', value: safe(values.merchantFeePercentage) },
                        { key: 'ServiceChargeType', value: safe(values.serviceChargeType) },
                        { key: 'IsKdsAvailable', value: String(values.isKdsAvailable ?? false) },
                        { key: 'IsExpeditorAvailable', value: String(values.isExpeditorAvailable ?? false) },
                        { key: 'PosSessionTimeout', value: safe(values.posSessionTimeout) },
                        {
                            key: 'OperationStartTime',
                            value: values.operationStartTime
                                ? values.operationStartTime.format('HH:mm:ss')
                                : ''
                        },
                        {
                            key: 'OperationEndTime',
                            value: values.operationEndTime
                                ? values.operationEndTime.format('HH:mm:ss')
                                : ''
                        },
                        { key: 'TimeZone', value: safe(values.timeZone || 'Asia/Colombo') },
                        { key: 'Currency', value: safe(values.currency || 'LKR') },
                        { key: 'Language', value: safe(values.language || 'English') }
                    ]
                },
                availabilities: values.availabilities ?? []
            };

            onSave(branch);
            setIsModalVisible(false);
        });
    };

    const columns = [
        {
            title: 'Code',
            dataIndex: 'code',
            render: (t: string) => <Tag>{t}</Tag>
        },
        {
            title: 'Branch Name',
            dataIndex: 'name',
            render: (text: string) => (
                <Space>
                    <ShopOutlined style={{ color: token.colorPrimary }} />
                    <strong>{text}</strong>
                </Space>
            )
        },
        { title: 'City', dataIndex: ['address', 'city'] },
        { title: 'Phone', dataIndex: 'phoneNumber' },
        {
            title: 'Status',
            dataIndex: 'isActive',
            render: (v: boolean) => (
                <Tag color={v ? 'green' : 'red'}>
                    {v ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            render: (_: any, record: Branch) => (
                <Space>
                    <Button
                        type="text"
                        icon={<ApartmentOutlined />}
                        onClick={() => setCatalogBranch(record)}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    />
                    <Popconfirm
                        title="Delete branch?"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={3}>Branch Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                    Add Branch
                </Button>
            </div>

            <div style={{
                background: token.colorBgContainer,
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                overflow: 'hidden'
            }}>
                <Table
                    className="custom-table"
                    dataSource={branches}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </div>

            {catalogBranch && (
                <BranchCatalogView
                    branch={catalogBranch}
                    open
                    onClose={() => setCatalogBranch(null)}
                />
            )}

            <Modal
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                width={900}
                title={
                    <div style={{
                        textAlign: 'center',
                        width: '100%',
                        fontWeight: 700,
                        fontSize: 20
                    }}>
                        {editingBranch ? editingBranch.name : 'Add Branch'}
                    </div>
                }
            >
                <Form form={form} layout="vertical">
                    <Tabs
                        items={[
                            {
                                key: '1',
                                label: 'General',
                                children: (
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="code" label="Branch Code" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="name" label="Branch Name" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item name="isActive" label="Status">
                                            <Select>
                                                <Option value={true}>Active</Option>
                                                <Option value={false}>Inactive</Option>
                                            </Select>
                                        </Form.Item>
                                    </>
                                )
                            },

                            {
                                key: '2',
                                label: 'Address',
                                children: (
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'addressLine1']} label="Address Line 1" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'addressLine2']} label="Address Line 2" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'city']} label="City" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'state']} label="State" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'country']} label="Country" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'latitude']} label="Latitude">
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item name={['address', 'longitude']} label="Longitude">
                                            <Input />
                                        </Form.Item>
                                    </>
                                )
                            },

                            {
                                key: '3',
                                label: 'Settings',
                                children: (
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="serviceCharge" label="Service Charge">
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="merchantFeePercentage" label="Merchant Fee (%)">
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item name="serviceChargeType" label="Service Charge Type">
                                            <Select>
                                                <Option value="Percentage">Percentage</Option>
                                                <Option value="Fixed">Fixed</Option>
                                            </Select>
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="isKdsAvailable" valuePropName="checked" label="KDS Available">
                                                    <Switch disabled={tenantSettings['IsKdsAvailable'] !== 'true'} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="isExpeditorAvailable" valuePropName="checked" label="Expeditor Available">
                                                    <Switch disabled={tenantSettings['IsExpeditorAvailable'] !== 'true'} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="posSessionTimeout" label="POS Session Timeout">
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="timeZone" label="Time Zone">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="currency" label="Currency">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="language" label="Language">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </>
                                )
                            },

                            {
                                key: '4',
                                label: (
                                    <span>
                                        <ClockCircleOutlined /> Weekly Availability
                                    </span>
                                ),
                                children: (
                                    <Form.Item name="availabilities">
                                        <AvailabilityEditor
                                            value={availabilities}
                                            onChange={v =>
                                                form.setFieldsValue({ availabilities: v })
                                            }
                                        />
                                    </Form.Item>
                                )
                            }
                        ]}
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default BranchView;