import React, { useState } from 'react';
import {
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
    Col,
    Divider,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ShopOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { Branch } from '../../../shared/types';
import RichTable from '../../../shared/components/rich-table/RichTable';
import BranchCatalogView from './BranchCatalogView';
import { useTenantSettingsMap } from '../hooks/useTenantSettings';

import { parseAvailabilities, toBackendAvail } from '../api/branch-catalog.service';
import { AvailabilityEditor } from './AvailabilityEditor';

const { Option } = Select;
const { Title } = Typography;

const safe = (v: any) =>
    v === undefined || v === null || v === '' ? '' : String(v);

// =====================
// MAIN COMPONENT
// =====================
interface BranchViewProps {
    branches: Branch[];
    loading?: boolean;
    onSave: (branch: Branch) => void;
    onDelete: (id: string) => void;
}

const BranchView: React.FC<BranchViewProps> = ({ branches, loading = false, onSave, onDelete }) => {
    const { token } = theme.useToken();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [catalogBranch, setCatalogBranch] = useState<Branch | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [form] = Form.useForm();
    const availabilities = Form.useWatch('availabilities', form) || [];

    const { data: tenantSettings } = useTenantSettingsMap();

    const showModal = (branch?: Branch) => {
        const settings = branch?.configuration?.settings ?? [];
        const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

        if (branch) {
            setEditingBranch(branch);
            form.setFieldsValue({
                ...branch,
                availabilities: parseAvailabilities(branch.availabilities as any),
                serviceCharge: getSetting('ServiceCharge'),
                merchantFeePercentage: getSetting('MerchantFeePercentage'),
                serviceChargeType: getSetting('ServiceChargeType'),
                isKdsAvailable: getSetting('IsKdsAvailable') === 'true',
                isExpeditorAvailable: getSetting('IsExpeditorAvailable') === 'true',
                printerServer: getSetting('PrinterServer') || '',
                posSessionTimeout: Number(getSetting('PosSessionTimeout')) || 0,
                timeZone: getSetting('TimeZone') || 'Asia/Colombo',
                currency: getSetting('Currency') || 'LKR',
                language: getSetting('Language') || 'English',
            });
            setIsModalVisible(true);
            return;
        }

        const activeSettings = tenantSettings;

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
            printerServer: activeSettings['PrinterServer'] ?? '',
            posSessionTimeout: Number(activeSettings['PosSessionTimeout'] ?? 0),
            timeZone: activeSettings['DefaultTimeZone'] ?? 'Asia/Colombo',
            currency: activeSettings['DefaultCurrency'] ?? 'LKR',
            language: activeSettings['Language'] ?? 'English',
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
                        { key: 'PrinterServer', value: safe(values.printerServer) },
                        { key: 'PosSessionTimeout', value: safe(values.posSessionTimeout) },
                        {
                            key: 'OperationStartTime',
                            value: values.operationStartTime ? values.operationStartTime.format('HH:mm:ss') : '',
                        },
                        {
                            key: 'OperationEndTime',
                            value: values.operationEndTime ? values.operationEndTime.format('HH:mm:ss') : '',
                        },
                        { key: 'TimeZone', value: safe(values.timeZone || 'Asia/Colombo') },
                        { key: 'Currency', value: safe(values.currency || 'LKR') },
                        { key: 'Language', value: safe(values.language || 'English') },
                    ],
                },
                availabilities: (values.availabilities ?? []).map(toBackendAvail) as any,
            };

            onSave(branch);
            setIsModalVisible(false);
        });
    };

    const columns: ColumnsType<Branch> = [
        {
            title: 'Code',
            dataIndex: 'code',
            render: (t: string) => <Tag>{t}</Tag>,
        },
        {
            title: 'Branch Name',
            dataIndex: 'name',
            render: (text: string) => (
                <Space>
                    <ShopOutlined style={{ color: token.colorPrimary }} />
                    <strong>{text}</strong>
                </Space>
            ),
        },
        { title: 'City', dataIndex: ['address', 'city'] },
        { title: 'Phone', dataIndex: 'phoneNumber' },
        {
            title: 'Status',
            dataIndex: 'isActive',
            render: (v: boolean) => (
                <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
            ),
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
                    <Popconfirm title="Delete branch?" onConfirm={() => onDelete(record.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const paged = branches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24, gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={3} style={{ margin: 0 }}>Branch Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                    Add Branch
                </Button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                <RichTable<Branch>
                    data={paged}
                    columns={columns}
                    rowKey="id"
                    isLoading={loading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={branches.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={size => { setPageSize(size); setCurrentPage(1); }}
                    totalLabel="branches"
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
                    <div style={{ textAlign: 'center', width: '100%', fontWeight: 700, fontSize: 20 }}>
                        {editingBranch ? editingBranch.name : 'Add Branch'}
                    </div>
                }
            >
                <Form form={form} name="branch_form" layout="vertical">
                    <Tabs
                        items={[
                            {
                                key: '1',
                                label: 'General',
                                children: (
                                    <>
                                        <Row gutter={16}>
                                            {editingBranch && (
                                                <Col span={12}>
                                                    <Form.Item name="code" label="Branch Code">
                                                        <Input disabled />
                                                    </Form.Item>
                                                </Col>
                                            )}
                                            <Col span={12}>
                                                <Form.Item name="name" label="Branch Name" rules={[{ required: true }]}>
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            {!editingBranch && (
                                                <Col span={12}>
                                                    <Form.Item name="isActive" label="Status">
                                                        <Select>
                                                            <Option value={true}>Active</Option>
                                                            <Option value={false}>Inactive</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            )}
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
                                        {editingBranch && (
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item name="isActive" label="Status">
                                                        <Select>
                                                            <Option value={true}>Active</Option>
                                                            <Option value={false}>Inactive</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        )}
                                    </>
                                ),
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
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'latitude']} label="Latitude">
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name={['address', 'longitude']} label="Longitude">
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </>
                                ),
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
                                                <Form.Item name="serviceChargeType" label="Service Charge Type">
                                                    <Select>
                                                        <Option value="Percentage">Percentage</Option>
                                                        <Option value="Fixed">Fixed</Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="merchantFeePercentage" label="Merchant Fee (%)">
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="posSessionTimeout" label="POS Session Timeout">
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
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
                                            <Col span={24}>
                                                <Form.Item
                                                    name="printerServer"
                                                    label="Printer Server"
                                                >
                                                    <Input placeholder="Enter printer server" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="timeZone" label="Time Zone">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="currency" label="Currency">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="language" label="Language">
                                                    <Input disabled />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </>
                                ),
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
                                            onChange={v => form.setFieldsValue({ availabilities: v })}
                                        />
                                    </Form.Item>
                                ),
                            },
                        ]}
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default BranchView;
