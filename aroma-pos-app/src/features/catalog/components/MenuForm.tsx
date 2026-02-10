import React, { useEffect,useMemo, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, theme, message, Popconfirm, Typography, Tabs, Table, Switch, Modal } from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { MenuItem, ModifierGroup, Category, Device, ItemVariant, Variant } from '../../../shared/types';
import { Option } from 'antd/es/mentions';
import { VariantService } from '../api/variants.service';
import { showErrorMessage } from '@/src/shared/types/ui/ErrorMessageModel';

interface MenuFormProps {
    initialData?: MenuItem | null;
    categories: Category[];
    modifierGroups: ModifierGroup[];
    devices: Device[];
    onSave: (values: Omit<MenuItem, 'id'>) => void;
    onCancel: () => void;
    onDelete?: (id: string) => void;
}

const { TextArea } = Input;
const { Title, Text } = Typography;

const MenuForm: React.FC<MenuFormProps> = ({ initialData, categories, modifierGroups, onSave, onCancel, onDelete }) => {
    const [form] = Form.useForm();
    const { token } = theme.useToken();
    const [variants, setVariants] = useState<ItemVariant[]>([]);
    const [availableVariants, setAvailableVariants] = useState<Variant[]>([]);
    const [activeTab, setActiveTab] = useState('1');

    const [popup, contextHolder] = Modal.useModal();

    useEffect(() => {
        const fetchVariants = async () => {
            const data = await VariantService.getVariants();

            if (data.success) {
                console.log(data);
                setAvailableVariants(data.data || []);
            } else {
                showErrorMessage(popup, data.message, "Variant Fetch Failed");
            }
        };
        fetchVariants();

    }, []);

    useEffect(() => {
        if (initialData) {
            (form as any).setFieldsValue({
                ...initialData,
                status: initialData.status === 'Available',
                modifierGroupIds: initialData.modifierGroups?.map(g => g.modifierGroupId) || initialData.modifierGroupIds || []
            });

            if (initialData.variants) {
                setVariants(initialData.variants);
            }
        } else {
            (form as any).resetFields();
            setVariants([]);
            (form as any).setFieldsValue({ status: true, modifierGroupIds: [] });
        }
    }, [initialData, form]);

    const onFinish = (values: any) => {
        if (variants.length === 0) {
            message.error('At least one variant is required.');
            setActiveTab('2');
            return;
        }

        const finalData = {
            name: values.name,
            description: values.description,
            categoryId: values.categoryId,
            status: values.status ? 'Available' : 'Unavailable',
            modifierGroupIds: values.modifierGroupIds,
            tagIds: [],
            variants: variants
        };
        onSave(finalData as any);
    };

    const handleAddVariant = () => {
        setVariants([...variants, { variantId: '', price: 0, status: 'Available' }]);
    };

    const handleVariantChange = (index: number, field: keyof ItemVariant, value: any) => {
        const newVars = [...variants];
        newVars[index] = { ...newVars[index], [field]: value };
        setVariants(newVars);
    };

    const handleDeleteVariant = (index: number) => {
        const newVars = [...variants];
        newVars.splice(index, 1);
        setVariants(newVars);
    };

    const variantColumns = useMemo(() => [
    {
        title: 'Variant Type',
        dataIndex: 'variantId',
        render: (val: string, record: ItemVariant, index: number) => (
            <Select
                placeholder="Select Size"
                value={val || undefined}
                onChange={v => handleVariantChange(index, 'variantId', v)}
                style={{ width: 150 }}
            >
                {availableVariants.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
            </Select>
        )
    },
    {
        title: 'Price',
        dataIndex: 'price',
        render: (val: number, record: ItemVariant, index: number) => (
            <InputNumber
                min={0}
                prefix="$"
                value={val}
                // Ensure this triggers the state update correctly
                onChange={val => handleVariantChange(index, 'price', val)}
                style={{ width: '100%' }}
            />
        )
    },
    {
        title: 'Action',
        render: (_: any, record: any, index: number) => (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteVariant(index)} />
        )
    }
], [availableVariants, variants]);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden'
        }}>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {initialData ? 'Edit Menu Item' : 'New Menu Item'}
                    </Title>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                        {
                            key: '1',
                            label: 'Basic Info',
                            children: (
                                <div style={{ padding: '8px 0' }}>
                                    <Form.Item name="name" label="Item Name" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Classic Burger" size="large" />
                                    </Form.Item>
                                    <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
                                        <Select placeholder="Select Category" size="large">
                                            {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Description" name="description">
                                        <TextArea rows={4} style={{ resize: 'none' }} />
                                    </Form.Item>
                                    <Form.Item name="status" valuePropName="checked" label="Available Status">
                                        <Switch checkedChildren="Available" unCheckedChildren="Sold Out" />
                                    </Form.Item>
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: 'Variants & Price',
                            children: (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <Text type="secondary">Define price points (e.g., Standard, Large).</Text>
                                        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddVariant}>Add Variant</Button>
                                    </div>
                                    <Table
                                        dataSource={variants}
                                        columns={variantColumns}
                                        rowKey={(r) => r.variantId + Math.random()}
                                        pagination={false}
                                        size="small"
                                    />
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: 'Modifiers',
                            children: (
                                <Form.Item name="modifierGroupIds" label="Select Modifier Groups">
                                    <Select mode="multiple" placeholder="Select groups" size="large" style={{ width: '100%' }}>
                                        {modifierGroups.map(grp => (
                                            <Option key={grp.id} value={grp.id}>{grp.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )
                        }
                    ]} />
                </Form>
            </div>

            <div style={{ padding: '16px 32px', borderTop: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 16, background: token.colorBgLayout, justifyContent: 'flex-end' }}>
                {initialData && onDelete && (
                    <Popconfirm title="Delete Item" onConfirm={() => onDelete(initialData.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} style={{ marginRight: 'auto' }}>Delete</Button>
                    </Popconfirm>
                )}
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="primary" onClick={() => (form as any).submit()} icon={<SaveOutlined />}>Save</Button>
            </div>
        </div>
    );
};

export default MenuForm;