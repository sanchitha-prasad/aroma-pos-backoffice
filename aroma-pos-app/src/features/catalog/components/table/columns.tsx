import React from 'react';
import { Button, Tag, Typography, Space, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import StatusDot from '@/src/shared/components/rich-table/StatusDot';
import type { MenuItem, Category, ModifierGroup, Device } from '@/src/shared/types';

const { Text } = Typography;

interface ColumnDeps {
    categories: Category[];
    modifierGroups: ModifierGroup[];
    devices: Device[];
    onEdit: (item: MenuItem) => void;
    onDelete: (id: string) => void;
}

function getCatName(categories: Category[], id: string) {
    return categories.find(c => c.id === id)?.name ?? 'Uncategorised';
}

function getPriceRange(item: MenuItem): string {
    if (item.variants && item.variants.length > 0) {
        const prices = item.variants.map(v => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`;
    }
    return '—';
}

function getCategoryDevices(
    categories: Category[],
    devices: Device[],
    categoryId: string,
    type: 'KDS' | 'Printer',
): string[] {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return [];
    const ids = type === 'KDS' ? cat.KitichenDisplayIds : cat.PrinterIds;
    if (!ids || ids.length === 0) return [];
    return ids.map(id => devices.find(d => d.id === id)?.name).filter((n): n is string => !!n);
}

export function buildMenuColumns({
    categories,
    modifierGroups,
    devices,
    onEdit,
    onDelete,
}: ColumnDeps): ColumnsType<MenuItem> {
    return [
        {
            title: 'Item Name',
            key: 'name',
            width: 220,
            render: (_: unknown, item: MenuItem) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                    {item.description && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                                {item.description}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Category',
            key: 'category',
            width: 140,
            render: (_: unknown, item: MenuItem) => (
                <Tag style={{ borderRadius: 12 }}>{getCatName(categories, item.categoryId)}</Tag>
            ),
        },
        {
            title: 'Price',
            key: 'price',
            width: 140,
            align: 'right' as const,
            render: (_: unknown, item: MenuItem) => (
                <Text strong style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {getPriceRange(item)}
                </Text>
            ),
        },
        {
            title: 'Variants',
            key: 'variants',
            width: 160,
            render: (_: unknown, item: MenuItem) => {
                const names = (item.variants ?? []).map(v => v.variantName).filter(Boolean);
                if (names.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                return (
                    <Space size={4} wrap>
                        {names.slice(0, 3).map(n => (
                            <Tag key={n} style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>{n}</Tag>
                        ))}
                        {names.length > 3 && (
                            <Tag style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>+{names.length - 3}</Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'Modifiers',
            key: 'modifiers',
            width: 180,
            render: (_: unknown, item: MenuItem) => {
                const names = (item.modifierGroupIds ?? [])
                    .map(id => modifierGroups.find(g => g.id === id)?.name)
                    .filter((n): n is string => !!n);
                if (names.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                return (
                    <Space size={4} wrap>
                        {names.slice(0, 2).map(n => (
                            <Tag key={n} color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>{n}</Tag>
                        ))}
                        {names.length > 2 && (
                            <Tag color="purple" style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>+{names.length - 2}</Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: 'KDS',
            key: 'kds',
            width: 130,
            render: (_: unknown, item: MenuItem) => {
                const names = getCategoryDevices(categories, devices, item.categoryId, 'KDS');
                if (names.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                return (
                    <Space size={4} wrap>
                        {names.map(n => (
                            <Tag key={n} color="blue" style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>{n}</Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Printers',
            key: 'printers',
            width: 130,
            render: (_: unknown, item: MenuItem) => {
                const names = getCategoryDevices(categories, devices, item.categoryId, 'Printer');
                if (names.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
                return (
                    <Space size={4} wrap>
                        {names.map(n => (
                            <Tag key={n} color="geekblue" style={{ margin: 0, fontSize: 10, borderRadius: 8 }}>{n}</Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 110,
            render: (_: unknown, item: MenuItem) => (
                <StatusDot
                    variant={item.isActive ? 'success' : 'default'}
                    label={item.isActive ? 'Active' : 'Inactive'}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 90,
            fixed: 'right' as const,
            render: (_: unknown, item: MenuItem) => (
                <Space size={4}>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(item)}
                            style={{ color: '#6132C0' }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Delete item"
                        description="Are you sure you want to delete this menu item?"
                        onConfirm={() => onDelete(item.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete">
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                danger
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
}
