import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Card,
    Empty,
    Input,
    Space,
    Spin,
    Tag,
    Typography,
    theme,
} from 'antd';
import {
    AppstoreOutlined,
    ControlOutlined,
    DesktopOutlined,
    DragOutlined,
    FolderOpenOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { Device, Category } from '../../../shared/types';

const { Title, Text } = Typography;

const BRAND = '#6132C0';

const TRUNC: React.CSSProperties = { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

interface DeviceCategoryViewProps {
    devices: Device[];
    categories: Category[];
    isLoading: boolean;
}

const DeviceCategoryView: React.FC<DeviceCategoryViewProps> = ({
    devices,
    categories,
    isLoading,
}) => {
    const { token } = theme.useToken();

    // Selection
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Search
    const [deviceSearch, setDeviceSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [localSequence, setLocalSequence] = useState<string[]>([]);

    const dDeviceSearch = useDeferredValue(deviceSearch);
    const dCategorySearch = useDeferredValue(categorySearch);

    // Filter devices on the left: ONLY POS devices
    const posDevices = useMemo(() => {
        return devices.filter(d => d.type?.name?.toUpperCase() === 'POS');
    }, [devices]);

    // Keep selected device in sync
    useEffect(() => {
        if (selectedDevice) {
            const refreshed = posDevices.find(d => d.id === selectedDevice.id);
            setSelectedDevice(refreshed ?? null);
        }
    }, [posDevices]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-select first POS device
    useEffect(() => {
        if (!selectedDevice && !isLoading && posDevices.length > 0) {
            setSelectedDevice(posDevices[0]);
        }
    }, [isLoading, posDevices]); // eslint-disable-line react-hooks/exhaustive-deps

    // Filtered device list based on search
    const visibleDevices = useMemo(() => {
        const q = dDeviceSearch.trim().toLowerCase();
        if (!q) return posDevices;
        return posDevices.filter(d => d.name.toLowerCase().includes(q) || (d.location ?? '').toLowerCase().includes(q));
    }, [posDevices, dDeviceSearch]);

    // Initialize sequence of all categories for the selected device
    useEffect(() => {
        if (selectedDevice) {
            const stored = localStorage.getItem(`device_categories_seq_${selectedDevice.id}`);
            const allCatIds = categories.map(c => c.id);
            
            if (stored) {
                const parsed = JSON.parse(stored) as string[];
                // Filter out any IDs that no longer exist in the categories list
                const validParsed = parsed.filter(id => allCatIds.includes(id));
                // Add any new categories that weren't in local storage yet
                const missing = allCatIds.filter(id => !validParsed.includes(id));
                setLocalSequence([...validParsed, ...missing]);
            } else {
                setLocalSequence(allCatIds);
            }
        } else {
            setLocalSequence([]);
        }
    }, [selectedDevice, categories]);

    // Save sequence of categories to local storage
    const saveSequence = (seq: string[]) => {
        if (selectedDevice) {
            localStorage.setItem(`device_categories_seq_${selectedDevice.id}`, JSON.stringify(seq));
            setLocalSequence(seq);
        }
    };

    // Sort all categories according to localSequence
    const sequencedCategories = useMemo(() => {
        const catMap = new Map(categories.map(c => [c.id, c]));
        const orderedList: Category[] = [];

        localSequence.forEach(id => {
            const cat = catMap.get(id);
            if (cat) {
                orderedList.push(cat);
                catMap.delete(id);
            }
        });

        // Add any remaining categories that were not in localSequence
        catMap.forEach(cat => orderedList.push(cat));

        return orderedList;
    }, [categories, localSequence]);

    // Filter categories by search input
    const visibleCategories = useMemo(() => {
        const q = dCategorySearch.trim().toLowerCase();
        if (!q) return sequencedCategories;
        return sequencedCategories.filter(c => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q));
    }, [sequencedCategories, dCategorySearch]);

    // --- Drag and Drop Handlers ---
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const nextSequence = [...localSequence];
        const draggedId = nextSequence[draggedIndex];
        
        // Remove from old position and insert at new position
        nextSequence.splice(draggedIndex, 1);
        nextSequence.splice(index, 0, draggedId);
        
        setDraggedIndex(index);
        setLocalSequence(nextSequence);
    };

    const handleDrop = () => {
        saveSequence(localSequence);
        setDraggedIndex(null);
    };



    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, gap: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>POS Category Sequencing</Title>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: 20, overflow: 'hidden', minHeight: 0 }}>
                {/* --- Left Pane: POS Devices --- */}
                <div
                    style={{
                        width: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        background: token.colorBgContainer,
                        borderRadius: 14,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                >
                    <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Space>
                                <div
                                    style={{
                                        width: 30, height: 30, borderRadius: 8,
                                        background: `linear-gradient(135deg, ${BRAND}, #8b5cf6)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <DesktopOutlined style={{ color: '#fff', fontSize: 15 }} />
                                </div>
                                <div>
                                    <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.2 }}>POS Terminals</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{posDevices.length} active POS</Text>
                                </div>
                            </Space>
                        </div>

                        <Input
                            allowClear
                            placeholder="Search POS devices…"
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={deviceSearch}
                            onChange={(e) => setDeviceSearch(e.target.value)}
                            style={{ borderRadius: 8 }}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : visibleDevices.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No POS devices found"
                                style={{ marginTop: 40 }}
                            />
                        ) : (
                            visibleDevices.map((dev) => {
                                const sel = selectedDevice?.id === dev.id;
                                return (
                                    <div
                                        key={dev.id}
                                        onClick={() => setSelectedDevice(dev)}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            cursor: 'pointer',
                                            background: sel ? token.colorPrimaryBg : token.colorBgContainer,
                                            border: `1px solid ${sel ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                                            marginBottom: 6,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorPrimaryBorderHover; }}
                                        onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorBorderSecondary; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ fontSize: 14, color: sel ? BRAND : token.colorText, ...TRUNC }} title={dev.name}>{dev.name}</Text>
                                                {dev.location && (
                                                    <Text type="secondary" style={{ fontSize: 12, ...TRUNC }} title={dev.location}>{dev.location}</Text>
                                                )}
                                                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {dev.ipAddress && (
                                                        <Tag style={{ fontSize: 10, borderRadius: 4, margin: 0, fontFamily: 'monospace' }}>
                                                            {dev.ipAddress}
                                                        </Tag>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- Right Pane: Categories Sequencing --- */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                    {!selectedDevice ? (
                        <div
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: token.colorBgContainer, borderRadius: 14,
                                border: `1px dashed ${token.colorBorderSecondary}`, gap: 12,
                            }}
                        >
                            <FolderOpenOutlined style={{ fontSize: 52, color: token.colorTextQuaternary }} />
                            <Text type="secondary">Select a POS terminal from the left panel to configure category sequencing</Text>
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                background: token.colorBgContainer, borderRadius: 14,
                                border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}
                        >
                            {/* POS Device Details Header */}
                            <div style={{ padding: '16px 20px', background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <Space align="center" style={{ marginBottom: 2 }} wrap>
                                            <Title level={4} style={{ margin: 0 }}>{selectedDevice.name}</Title>
                                            <Tag color="purple" style={{ borderRadius: 8, paddingInline: 8 }}>
                                                POS Terminal
                                            </Tag>
                                        </Space>
                                        <Text type="secondary" style={{ fontSize: 12.5, display: 'block' }}>
                                            Location: {selectedDevice.location || '—'} · IP Address: {selectedDevice.ipAddress || '—'}
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            {/* Categories Header */}
                            <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${token.colorBorderSecondary}40` }}>
                                <ControlOutlined style={{ color: BRAND }} />
                                <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Category Sequencing (Drag to Reorder)</Text>
                                <Tag color="purple" style={{ margin: 0 }}>{categories.length} categories</Tag>
                                <div style={{ flex: 1 }} />
                                {categories.length > 0 && (
                                    <Input
                                        allowClear
                                        size="small"
                                        placeholder="Filter categories…"
                                        prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                        style={{ width: 200, borderRadius: 6 }}
                                    />
                                )}
                            </div>

                            {/* Drag and Drop list */}
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {visibleCategories.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories available" />
                                    </div>
                                ) : (
                                    visibleCategories.map((cat, idx) => {
                                        return (
                                            <div
                                                key={cat.id}
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDrop={handleDrop}
                                                onDragEnd={handleDrop}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                    background: draggedIndex === idx ? token.colorFillAlter : token.colorBgContainer,
                                                    display: 'flex',
                                                    gap: 10,
                                                    alignItems: 'center',
                                                    cursor: 'grab',
                                                    opacity: draggedIndex === idx ? 0.5 : 1,
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                                                    transition: 'border-color 0.15s, background-color 0.15s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    const el = e.currentTarget as HTMLDivElement;
                                                    el.style.borderColor = BRAND;
                                                    el.style.backgroundColor = token.colorFillAlter;
                                                }}
                                                onMouseLeave={(e) => {
                                                    const el = e.currentTarget as HTMLDivElement;
                                                    el.style.borderColor = token.colorBorderSecondary;
                                                    if (draggedIndex !== idx) el.style.backgroundColor = token.colorBgContainer;
                                                }}
                                            >
                                                <DragOutlined style={{ color: token.colorTextTertiary, cursor: 'grab', fontSize: 13 }} />
                                                
                                                <Tag color="purple" style={{ margin: 0, fontSize: 11, fontWeight: 600, minWidth: 38, textAlign: 'center', borderRadius: 4 }}>
                                                    {idx + 1}
                                                </Tag>
                                                
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ fontSize: 13.5, ...TRUNC }} title={cat.name}>{cat.name}</Text>
                                                </div>
                                                
                                                {cat.description && (
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <Text type="secondary" style={{ fontSize: 11.5, ...TRUNC }} title={cat.description}>{cat.description}</Text>
                                                    </div>
                                                )}

                                                <div>
                                                    {cat.isActive ? (
                                                        <Tag color="success" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>Active</Tag>
                                                    ) : (
                                                        <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>Inactive</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeviceCategoryView;
