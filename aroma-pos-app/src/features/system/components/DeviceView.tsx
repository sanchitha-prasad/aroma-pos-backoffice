import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Typography, theme, Popconfirm, InputNumber, Form, Tabs, Tag, Select, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DesktopOutlined, FilterOutlined, CreditCardOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { Device, DeviceType, DeviceProtocol, DeviceStatus } from '../../../shared/types';
import { systemService } from '../api/system.service';
import { Option } from 'antd/es/mentions';
import { DeviceStatusType,DeviceProtocolType,DeviceTypeEnum,CardProviderType } from '@/src/shared/enums';
import { DeviceSevices } from '../api/device.service'; 
const { useWatch } = Form;

interface DeviceViewProps {
    devices: Device[];
    onSave: (device: Device) => void;
    onDelete: (id: string) => void;
}

const DeviceView: React.FC<DeviceViewProps> = ({ devices, onSave, onDelete }) => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [protocols, setProtocols] = useState<DeviceProtocol[]>([]);

    const selectedTypeId = useWatch('deviceTypeId', form);

    const isPax = deviceTypes.find(t => t.id === selectedTypeId)?.name === DeviceTypeEnum[DeviceTypeEnum.PAX];

    useEffect(() => {
        if (!isPax) {
            form.setFieldValue('provider', undefined);
        }
    }, [isPax, form]);

    useEffect(() => {
        Promise.all([DeviceSevices.getDeviceTypes(), DeviceSevices.getDeviceProtocols()])
            .then(([typesRes, protos]) => {
                setDeviceTypes(typesRes.data);
                setProtocols(protos.data);
            })
            .catch(err => console.error("Failed to load device meta", err));
    }, []);

    const showModal = (device?: Device) => {
        if (device) {
            setEditingDevice(device);
            (form as any).setFieldsValue({
                ...device,
                deviceTypeId: device.type?.id,
                deviceProtocolId: device.protocol?.id
            });
        } else {
            setEditingDevice(null);
            (form as any).resetFields();
            (form as any).setFieldsValue({ status: 'Active' });
        }
        setIsModalVisible(true);
    };

    const handleOk = () => {
        (form as any).validateFields().then((values: any) => {
            const newDevice: Device = {
                id: editingDevice ? editingDevice.id : '',
                ...values
            };
            onSave(newDevice);
            setIsModalVisible(false);
        });
    };

    const filteredDevices = devices.filter(d => 
        d.name.toLowerCase().includes(searchText.toLowerCase()) || 
        d.location?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        { 
            title: 'Name', 
            dataIndex: 'name', 
            key: 'name',
            render: (text: string, record: Device) => (
                // <Space>
                //     <DesktopOutlined style={{ color: token.colorPrimary }} />
                //     <span style={{ fontWeight: 500 }}>{text}</span>
                //     {record.serialNumber && <span style={{ fontSize: 11, color: '#999' }}>({record.serialNumber})</span>}
                // </Space>
            <div>
                <div style={{ fontWeight: 500 }}>
                    <DesktopOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
                    {text}
                </div>
                    {record.serialNumber && (
                        <div style={{ fontSize: 11, color: '#999', marginLeft: 22 }}>
                            {record.serialNumber}
                        </div>
                    )}
             </div>
            )
        },
        { 
            title: 'Type', 
            dataIndex: ['type', 'name'], 
            key: 'type',
            render: (text: string) => <Tag color="blue">{text || 'N/A'}</Tag>
        },
        { 
            title: 'Location', 
            dataIndex: 'location', 
            key: 'location' 
        },
        { 
            title: 'IP Address', 
            dataIndex: 'ipAddress', 
            key: 'ip',
            render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text || '--'}</span>
        },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status: DeviceStatus) => {
                const isOnline = status === 'Online' || status === 'Active';
                return <Tag color={isOnline ? 'green' : 'red'}>{status}</Tag>;
            }
        },
        { 
            title: 'Provider', 
            dataIndex: 'provider', 
            key: 'provider'
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '120px',
            render: (_: any, record: Device) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: token.colorPrimary }} />} onClick={() => showModal(record)} />
                    <Popconfirm title="Delete device?" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined style={{ color: 'red' }} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Typography.Title level={2} style={{ margin: 0 }}>Device Management</Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                    Add Device
                </Button>
            </div>
            
            <div style={{ background: token.colorBgContainer, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                 <div style={{ padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <Input placeholder="Search devices..." onChange={e => setSearchText(e.target.value)} style={{ maxWidth: 300 }} />
                 </div>
                 <Table className="custom-table" dataSource={filteredDevices} columns={columns} rowKey="id" pagination={{ pageSize: 8 }} />
            </div>

            <Modal 
                title={editingDevice ? "Edit Device" : "Add Device"} 
                open={isModalVisible} 
                onOk={handleOk} 
                onCancel={() => setIsModalVisible(false)}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <Form.Item name="name" label="Device Name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. POS 1" />
                        </Form.Item>
                        <Form.Item name="deviceTypeId" label="Device Type" rules={[{ required: true }]}>
                        <Select placeholder="Select a device type">
                            {deviceTypes.map((type) => (
                                <Option key={type.id} value={type.id}>{type.name}</Option>
                            ))}
                        </Select>
                        </Form.Item>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>DeviceStatusType
                                <Option value={DeviceStatusType.Active}> {DeviceStatusType[DeviceStatusType.Active]}</Option>
                                <Option value={DeviceStatusType.InActive}> {DeviceStatusType[DeviceStatusType.InActive]}</Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                        <Form.Item name="deviceProtocolId" label="Protocol">

                            <Select placeholder="Select a protocol">
                                 {protocols.map((proto:DeviceProtocol) => (
                                    <Option key={proto.id} value={proto.id}>{proto.name}</Option>
                                ))} 
    
                            </Select>
                                
                        </Form.Item>

                         <Form.Item name="location" label="Location">
                            <Input placeholder="e.g. Building A" />
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
                            <Input placeholder="e.g. SN-2025-AX94-4495"/>
                        </Form.Item>
                         <Form.Item name="provider" label={<span style={{ color: isPax ? 'inherit' : token.colorTextDisabled }}>Provider</span>} >
                            <Select 
                                placeholder="Select a provider" 
                                disabled={!isPax} 
                                allowclear
                            >
                                <Option value={CardProviderType.HNB}> {CardProviderType[CardProviderType.HNB]}</Option>
                            </Select>
                        </Form.Item>

                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DeviceView;