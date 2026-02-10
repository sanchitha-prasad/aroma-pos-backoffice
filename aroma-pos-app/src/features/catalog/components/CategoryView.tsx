import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Typography, theme, Popconfirm, message, Select, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Category, Device, Tax } from '../../../shared/types';
import { Option } from 'antd/es/mentions';

interface CategoryViewProps {
    categories: Category[];
    devices?: Device[]; 
    taxes?: Tax[];
    onSave: (cat: Category) => void;
    onDelete: (id: string) => void;
}


const CategoryView: React.FC<CategoryViewProps> = ({ categories, devices = [], taxes = [], onSave, onDelete }) => {
    const { token } = theme.useToken();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    
    const [selectedKds, setSelectedKds] = useState<string[]>([]);
    const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
    const [selectedTaxes, setSelectedTaxes] = useState<string[]>([]);

    const showModal = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat);
            setName(cat.name);
            setDesc(cat.description || '');
            setSelectedKds(cat.kitchenDisplays?.map(d => d.id)|| []);
            setSelectedPrinters(cat.PrinterIds || []);
            setSelectedTaxes(cat.taxes?.map(t => t.id) || []);
        } else {
            setEditingCat(null);
            setName('');
            setDesc('');
            setSelectedKds([]);
            setSelectedPrinters([]);
            setSelectedTaxes([]);
        }
        setIsModalVisible(true);
    };

    const handleOk = () => {
        if (!name) return message.error("Name is required");
        const newCat: Category = {
            id: editingCat ? editingCat.id : '',
            name,
            description: desc,
            isActive: true,
            KitichenDisplayIds: selectedKds,
            PrinterIds: selectedPrinters,
            taxIds: selectedTaxes
        };
        onSave(newCat);
        setIsModalVisible(false);
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', width: '20%', render: (t: string) => <strong style={{ color: token.colorText }}>{t}</strong> },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { 
            title: 'Taxes', 
            key: 'taxes',
            render: (_: any, r: Category) => {
                if (r.taxes && r.taxes.length > 0) {
                    return r.taxes.map(t => <Tag key={t.id} color="purple">{t.name}</Tag>);
                }
                return <span style={{ color: '#ccc' }}>--</span>;
            }
        },
        { 
            title: 'KDS Screens', 
            key: 'kds',
            render: (_: any, r: Category) => {
                if (r.kitchenDisplays && r.kitchenDisplays.length > 0) {
                    return r.kitchenDisplays.map(d => <Tag key={d.id} color="blue">{d.name}</Tag>);
                }
                return <span style={{ color: '#ccc' }}>--</span>;
            }
        },
        { 
            title: 'Printers', 
            key: 'printers',
            render: (_: any, r: Category) => {
                if (r.PrinterIds && r.PrinterIds.length > 0) {
                    return r.PrinterIds.map(id => <Tag key={id} color="green">Printer {id}</Tag>);
                }
                return <span style={{ color: '#ccc' }}>--</span>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '100px',
            render: (_: any, record: Category) => (
                <Space>
                    <Button type="text" icon={<EditOutlined style={{ color: token.colorPrimary }} />} onClick={() => showModal(record)} />
                    <Popconfirm title="Delete?" onConfirm={() => onDelete(record.id)} okButtonProps={{ danger: true }}>
                        <Button type="text" icon={<DeleteOutlined style={{ color: 'red' }} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Typography.Title level={2} style={{ margin: 0 }}>Categories</Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Add Category</Button>
            </div>
            <div style={{ background: token.colorBgContainer, borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
                 <Table className="custom-table" dataSource={categories} columns={columns} rowKey="id" pagination={false} />
            </div>

            <Modal 
                title={editingCat ? "Edit Category" : "Add Category"} 
                open={isModalVisible} 
                onOk={handleOk} 
                onCancel={() => setIsModalVisible(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                    <Input placeholder="Category Name" value={name} onChange={e => setName(e.target.value)} />
                    <Input.TextArea placeholder="Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} />
                    
                    <div>
                        <div style={{marginBottom: 6, fontWeight: 500}}>Applicable Taxes</div>
                        <Select 
                            mode="multiple" 
                            style={{width: '100%'}} 
                            placeholder="Select taxes"
                            value={selectedTaxes}
                            onChange={setSelectedTaxes}
                        >
                            {taxes.map(t => (
                                <Option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <div style={{marginBottom: 6, fontWeight: 500}}>KDS Routing</div>
                        <Select 
                            mode="multiple" 
                            style={{width: '100%'}} 
                            placeholder="Select KDS screens"
                            value={selectedKds}
                            onChange={setSelectedKds}
                        >
                            {devices.filter(d => d.type?.name === 'KDS' || d.type?.name === 'Kitchen Display').map(d => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <div style={{marginBottom: 6, fontWeight: 500}}>Printer Routing</div>
                         <Select 
                            mode="multiple" 
                            style={{width: '100%'}} 
                            placeholder="Select Printers"
                            value={selectedPrinters}
                            onChange={setSelectedPrinters}
                        >
                            {devices.filter(d => d.type?.name === 'PRINTER').map(d => (
                                <Option key={d.id} value={d.id}>{d.name}</Option>
                            ))}
                        </Select>
                    </div>

                </div>
            </Modal>
        </div>
    );
};

export default CategoryView;