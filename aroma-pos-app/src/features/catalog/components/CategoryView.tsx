import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Button,
    Empty,
    Form,
    Input,
    Modal,
    Popover,
    Popconfirm,
    Segmented,
    Select,
    Skeleton,
    Space,
    Switch,
    Tag,
    Tooltip,
    Typography,
    theme,
} from 'antd';
import { globalMessage as message } from '../../../shared/services/api/globalMessage';
import {
    AppstoreAddOutlined,
    AppstoreOutlined,
    CheckCircleFilled,
    DeleteOutlined,
    EditOutlined,
    FolderOpenOutlined,
    MinusCircleOutlined,
    PauseCircleFilled,
    PlusOutlined,
    SearchOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import type { UseMutationResult } from '@tanstack/react-query';
import { Category, Device, MenuItem, Tax } from '../../../shared/types';

const { Title, Text } = Typography;

const BRAND = '#6132C0';

// Cheap CSS truncation. Avoids antd <Text ellipsis> which attaches a
// ResizeObserver + live DOM measurement to every instance — far too costly
// when dozens of item cards render at once.
const TRUNC: React.CSSProperties = { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/**
 * Items belong to exactly one category (`Item.CategoryId` is a single required
 * field on the backend). "Assigning" an item to a category therefore reassigns
 * it from whatever category it currently sits in — there is no many-to-many.
 * Reassignment is a partial `PUT /api/items/{id}`; the backend treats omitted
 * collections (variants/tags/modifiers) as "no change", so they are preserved.
 */
interface CategoryViewProps {
    categories: Category[];
    devices?: Device[];
    taxes?: Tax[];
    items?: MenuItem[];
    isLoading?: boolean;
    itemsLoading?: boolean;
    itemsFetching?: boolean;
    createCategory: UseMutationResult<any, any, any, any>;
    updateCategory: UseMutationResult<any, any, any, any>;
    deleteCategory: UseMutationResult<any, any, any, any>;
    updateItem: UseMutationResult<any, any, any, any>;
}

const CategoryView: React.FC<CategoryViewProps> = ({
    categories,
    devices = [],
    taxes = [],
    items = [],
    isLoading = false,
    itemsLoading = false,
    itemsFetching = false,
    createCategory,
    updateCategory,
    deleteCategory,
    updateItem,
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat]   = useState<Category | null>(null);

    // List controls
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [itemSearch, setItemSearch]     = useState('');
    const [availSearch, setAvailSearch]   = useState('');

    // Per-row loading
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [movingItemId, setMovingItemId] = useState<string | null>(null);
    const [targetCatId, setTargetCatId] = useState<string | null>(null);

    const printers   = useMemo(() => devices.filter(d => d.type?.name === 'PRINTER'), [devices]);
    const kdsScreens = useMemo(() => devices.filter(d => d.type?.name === 'KDS' || d.type?.name === 'Kitchen Display'), [devices]);

    // Keep selectedCat in sync as the query refreshes.
    useEffect(() => {
        if (selectedCat) {
            const refreshed = categories.find(c => c.id === selectedCat.id);
            setSelectedCat(refreshed ?? null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories]);

    // Auto-select the first category once data loads.
    useEffect(() => {
        if (!selectedCat && !isLoading && categories.length > 0) setSelectedCat(categories[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading, categories]);

    const activeCount = useMemo(() => categories.filter(c => c.isActive).length, [categories]);

    // O(1) category-name lookups — avoids a linear `find` per available-item card.
    const catNameById = useMemo(() => {
        const map = new Map<string, string>();
        categories.forEach(c => map.set(c.id, c.name));
        return map;
    }, [categories]);
    const catNameOf = (id: string) => catNameById.get(id) ?? 'Uncategorized';

    const itemCountOf = useMemo(() => {
        const map = new Map<string, number>();
        items.forEach(i => map.set(i.categoryId, (map.get(i.categoryId) ?? 0) + 1));
        return map;
    }, [items]);

    // Defer search input so heavy list re-renders don't block typing.
    const dSearch     = useDeferredValue(search);
    const dItemSearch = useDeferredValue(itemSearch);
    const dAvailSearch = useDeferredValue(availSearch);

    // Filtered category list.
    const visibleCategories = useMemo(() => {
        const q = dSearch.trim().toLowerCase();
        return categories.filter(c => {
            if (statusFilter === 'active' && !c.isActive) return false;
            if (statusFilter === 'inactive' && c.isActive) return false;
            if (!q) return true;
            return c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
        });
    }, [categories, dSearch, statusFilter]);

    // Items in / out of the selected category.
    const assignedItems = useMemo(
        () => (selectedCat ? items.filter(i => i.categoryId === selectedCat.id) : []),
        [items, selectedCat],
    );
    const availableItems = useMemo(
        () => (selectedCat ? items.filter(i => i.categoryId !== selectedCat.id) : []),
        [items, selectedCat],
    );

    const visibleAssigned = useMemo(() => {
        const q = dItemSearch.trim().toLowerCase();
        if (!q) return assignedItems;
        return assignedItems.filter(i => i.name.toLowerCase().includes(q));
    }, [assignedItems, dItemSearch]);

    // Cap how many available cards render at once so a large catalog doesn't
    // mount hundreds of hover-animated nodes. Searching narrows the full set.
    const AVAIL_RENDER_CAP = 60;
    const filteredAvailable = useMemo(() => {
        const q = dAvailSearch.trim().toLowerCase();
        if (!q) return availableItems;
        return availableItems.filter(i => i.name.toLowerCase().includes(q));
    }, [availableItems, dAvailSearch]);
    const visibleAvailable = useMemo(
        () => filteredAvailable.slice(0, AVAIL_RENDER_CAP),
        [filteredAvailable],
    );
    const availableHiddenCount = filteredAvailable.length - visibleAvailable.length;

    // ── Category CRUD ───────────────────────────────────────────────────────────

    const openModal = (cat?: Category, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingCat(cat || null);
        if (cat) {
            form.setFieldsValue({
                name: cat.name,
                description: cat.description,
                isActive: cat.isActive,
                taxIds: cat.taxes?.map(t => t.id) ?? cat.taxIds ?? [],
                printerIds: cat.printers?.map((d: any) => d.id) ?? cat.printerIds ?? [],
                kitchenDisplayIds: cat.kitchenDisplays?.map((d: any) => d.id) ?? cat.kitchenDisplayIds ?? [],
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingCat) {
                await updateCategory.mutateAsync({ id: editingCat.id, data: values });
                message.success('Category updated');
            } else {
                await createCategory.mutateAsync(values);
                message.success('Category created');
            }
            setIsModalOpen(false);
        } catch {
            // antd validation / axios interceptor already surfaces the error
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await deleteCategory.mutateAsync(id);
            if (selectedCat?.id === id) setSelectedCat(null);
            message.success('Category deleted');
        } catch {
            // axios interceptor already shows a toast
        }
    };

    // Active toggle — collections are null-safe on the backend, so echo only the
    // core fields to avoid clearing taxes / device routing.
    const handleToggleActive = async (cat: Category, next: boolean) => {
        try {
            await updateCategory.mutateAsync({
                id: cat.id,
                data: { name: cat.name, description: cat.description, isActive: next },
            });
            message.success(next ? 'Category activated' : 'Category deactivated');
        } catch {
            // axios interceptor already shows a toast
        }
    };

    // ── Item assignment (reassign categoryId via partial update) ────────────────

    const handleAssignItem = async (item: MenuItem) => {
        if (!selectedCat || item.categoryId === selectedCat.id) return;
        setAssigningId(item.id);
        try {
            await updateItem.mutateAsync({
                id: item.id,
                data: {
                    name: item.name,
                    description: item.description,
                    isActive: item.isActive,
                    categoryId: selectedCat.id,
                    // The backend validator requires a non-empty `variants` set on every
                    // update (UpdateItemCommandValidator), and the controller maps an
                    // omitted list to empty — so echo the item's existing variants to
                    // preserve them. Tags/modifiers are null-safe and can be omitted.
                    variants: (item.variants ?? []).map(v => ({
                        variantId: v.variantId,
                        price: v.price,
                        status: v.status,
                    })),
                },
            });
            message.success(`"${item.name}" moved to ${selectedCat.name}`);
        } catch {
            // axios interceptor already shows a toast
        } finally {
            setAssigningId(null);
        }
    };

    const handleMoveItem = async (item: MenuItem, targetCategoryId: string) => {
        setAssigningId(item.id);
        try {
            const targetCat = categories.find(c => c.id === targetCategoryId);
            await updateItem.mutateAsync({
                id: item.id,
                data: {
                    name: item.name,
                    description: item.description,
                    isActive: item.isActive,
                    categoryId: targetCategoryId,
                    variants: (item.variants ?? []).map(v => ({
                        variantId: v.variantId,
                        price: v.price,
                        status: v.status,
                    })),
                },
            });
            message.success(`"${item.name}" moved to ${targetCat?.name ?? 'new category'}`);
        } catch {
            // axios interceptor already shows a toast
        } finally {
            setAssigningId(null);
            setMovingItemId(null);
            setTargetCatId(null);
        }
    };

    const handleRemoveFromCategory = async (item: MenuItem) => {
        setAssigningId(item.id);
        try {
            let uncategorizedCat = categories.find(
                c => c.name.toLowerCase() === 'uncategorized'
            );

            let targetCategoryId = '';
            if (uncategorizedCat) {
                targetCategoryId = uncategorizedCat.id;
            } else {
                const response = await createCategory.mutateAsync({
                    name: 'Uncategorized',
                    description: 'Default category for items without a category',
                    isActive: true,
                    taxIds: [],
                    kitchenDisplayIds: [],
                    printerIds: [],
                });
                targetCategoryId = response.id;
            }

            await updateItem.mutateAsync({
                id: item.id,
                data: {
                    name: item.name,
                    description: item.description,
                    isActive: item.isActive,
                    categoryId: targetCategoryId,
                    variants: (item.variants ?? []).map(v => ({
                        variantId: v.variantId,
                        price: v.price,
                        status: v.status,
                    })),
                },
            });
            message.success(`"${item.name}" removed from ${selectedCat?.name ?? 'category'}`);
        } catch {
            // axios interceptor already shows a toast
        } finally {
            setAssigningId(null);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 24, gap: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Categories</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>New Category</Button>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: 20, overflow: 'hidden', minHeight: 0 }}>

                {/* ── Left: Category list ── */}
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
                                    <AppstoreOutlined style={{ color: '#fff', fontSize: 15 }} />
                                </div>
                                <div>
                                    <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.2 }}>Categories</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{activeCount} active · {categories.length} total</Text>
                                </div>
                            </Space>
                        </div>

                        <Input
                            allowClear
                            placeholder="Search categories…"
                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ marginBottom: 10, borderRadius: 8 }}
                        />

                        <Segmented
                            block
                            size="small"
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
                            options={[
                                { label: `All (${categories.length})`, value: 'all' },
                                { label: `Active (${activeCount})`, value: 'active' },
                                { label: `Inactive (${categories.length - activeCount})`, value: 'inactive' },
                            ]}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                        {isLoading ? (
                            [1, 2, 3].map((n) => <Skeleton key={n} active paragraph={{ rows: 1 }} style={{ margin: '8px 4px' }} />)
                        ) : visibleCategories.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={categories.length === 0 ? 'No categories yet' : 'No categories match your filters'}
                                style={{ marginTop: 40 }}
                            />
                        ) : (
                            visibleCategories.map((cat) => {
                                const sel = selectedCat?.id === cat.id;
                                const count = itemCountOf.get(cat.id) ?? 0;
                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => setSelectedCat(cat)}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            background: sel ? token.colorPrimaryBg : token.colorBgContainer,
                                            border: `1px solid ${sel ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                                            marginBottom: 8,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorPrimaryBorderHover; }}
                                        onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorBorderSecondary; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                                                    <span
                                                        style={{
                                                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                                            background: cat.isActive ? '#52c41a' : token.colorTextQuaternary,
                                                            boxShadow: cat.isActive ? '0 0 0 3px rgba(82,196,26,0.15)' : 'none',
                                                        }}
                                                    />
                                                    <Text strong style={{ fontSize: 14.5, color: sel ? BRAND : token.colorText, ...TRUNC }} title={cat.name}>{cat.name}</Text>
                                                </div>
                                                {cat.description && (
                                                    <Text type="secondary" style={{ fontSize: 12.5, paddingLeft: 14, ...TRUNC }} title={cat.description}>{cat.description}</Text>
                                                )}
                                                <div style={{ marginTop: 8, paddingLeft: 14 }}>
                                                    <Tag icon={<AppstoreOutlined />} color={count > 0 ? 'purple' : 'default'} style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                                                        {count} {count === 1 ? 'item' : 'items'}
                                                    </Tag>
                                                </div>
                                            </div>
                                            <Space size={0} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                                                <Tooltip title="Edit">
                                                    <Button type="text" size="small" icon={<EditOutlined style={{ color: BRAND }} />} onClick={(e) => openModal(cat, e)} />
                                                </Tooltip>
                                                <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(cat.id)} okButtonProps={{ danger: true }}>
                                                    <Tooltip title="Delete">
                                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                                                    </Tooltip>
                                                </Popconfirm>
                                            </Space>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Right: Selected category detail ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                    {isLoading ? (
                        <div style={{ flex: 1, padding: 24, background: token.colorBgContainer, borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}` }}>
                            <Skeleton active paragraph={{ rows: 6 }} />
                        </div>
                    ) : !selectedCat ? (
                        <div
                            style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: token.colorBgContainer, borderRadius: 14,
                                border: `1px dashed ${token.colorBorderSecondary}`, gap: 12,
                            }}
                        >
                            <FolderOpenOutlined style={{ fontSize: 52, color: token.colorTextQuaternary }} />
                            <Text type="secondary">Select a category to manage its items</Text>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>Create your first category</Button>
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
                            {/* Header */}
                            <div style={{ padding: '20px 24px', background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <Space align="center" style={{ marginBottom: 4 }} wrap>
                                            <Title level={3} style={{ margin: 0 }} ellipsis={{ tooltip: selectedCat.name }}>{selectedCat.name}</Title>
                                            <Tag
                                                icon={selectedCat.isActive ? <CheckCircleFilled /> : <PauseCircleFilled />}
                                                color={selectedCat.isActive ? 'success' : 'default'}
                                                style={{ borderRadius: 12, paddingInline: 10 }}
                                            >
                                                {selectedCat.isActive ? 'Active' : 'Inactive'}
                                            </Tag>
                                        </Space>
                                        {selectedCat.description && (
                                            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{selectedCat.description}</Text>
                                        )}
                                    </div>
                                    <Space>
                                        <Tooltip title={selectedCat.isActive ? 'Set inactive' : 'Set active'}>
                                            <Switch
                                                checked={selectedCat.isActive}
                                                checkedChildren="On"
                                                unCheckedChildren="Off"
                                                loading={updateCategory.isPending}
                                                onChange={(v) => handleToggleActive(selectedCat, v)}
                                            />
                                        </Tooltip>
                                        <Button icon={<EditOutlined />} onClick={() => openModal(selectedCat)}>Edit</Button>
                                    </Space>
                                </div>

                                {/* Compact summary + routing */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                                    <Space size={6}>
                                        <AppstoreOutlined style={{ color: BRAND, fontSize: 13 }} />
                                        <Text type="secondary" style={{ fontSize: 12.5 }}>
                                            <Text strong style={{ color: BRAND }}>{assignedItems.length}</Text> items
                                        </Text>
                                    </Space>
                                    {!!selectedCat.taxes?.length && (
                                        <>
                                            <Text type="secondary" style={{ fontSize: 12.5 }}>·</Text>
                                            <Space size={4}>
                                                <TagsOutlined style={{ color: token.colorTextTertiary, fontSize: 13 }} />
                                                {selectedCat.taxes.map(t => <Tag key={t.id} color="purple" style={{ margin: 0, fontSize: 11 }}>{t.name}</Tag>)}
                                            </Space>
                                        </>
                                    )}
                                    {!!selectedCat.kitchenDisplays?.length && (
                                        selectedCat.kitchenDisplays.map((d: any) => <Tag key={d.id} color="blue" style={{ margin: 0, fontSize: 11 }}>{d.name}</Tag>)
                                    )}
                                    {!!selectedCat.printers?.length && (
                                        selectedCat.printers.map((d: any) => <Tag key={d.id} color="green" style={{ margin: 0, fontSize: 11 }}>{d.name}</Tag>)
                                    )}
                                </div>
                            </div>

                            {/* Assigned items toolbar */}
                            <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Items in this category</Text>
                                <div style={{ flex: 1 }} />
                                {assignedItems.length > 0 && (
                                    <Input
                                        allowClear
                                        size="small"
                                        placeholder="Filter items…"
                                        prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                                        value={itemSearch}
                                        onChange={(e) => setItemSearch(e.target.value)}
                                        style={{ width: 220, borderRadius: 8 }}
                                    />
                                )}
                            </div>

                            {/* Assigned grid */}
                            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 24px 16px' }}>
                                {itemsLoading ? (
                                    <Skeleton active paragraph={{ rows: 4 }} />
                                ) : assignedItems.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items in this category yet" />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Add items from the “Available to add” list below.</Text>
                                    </div>
                                ) : visibleAssigned.length === 0 ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No items match your filter" style={{ marginTop: 40 }} />
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                                        {visibleAssigned.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    padding: 14, borderRadius: 12,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                    background: token.colorBgContainer,
                                                    display: 'flex', gap: 12, alignItems: 'center',
                                                }}
                                            >
                                                <Avatar shape="square" size={40} style={{ background: token.colorPrimaryBg, color: BRAND, flexShrink: 0, borderRadius: 10, fontWeight: 700 }}>
                                                    {item.name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ fontSize: 13.5, ...TRUNC }} title={item.name}>{item.name}</Text>
                                                    <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 2 }}>
                                                        {item.variants?.length ? `${item.variants.length} variant${item.variants.length === 1 ? '' : 's'}` : 'No variants'}
                                                    </Text>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                    {!item.isActive && <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>Inactive</Tag>}
                                                    <Tooltip title="Remove">
                                                        <Popconfirm
                                                            title="Remove from category?"
                                                            onConfirm={() => handleRemoveFromCategory(item)}
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                danger
                                                                icon={<MinusCircleOutlined style={{ fontSize: 15 }} />}
                                                                loading={assigningId === item.id}
                                                            />
                                                        </Popconfirm>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Available to add: click to move into this category ── */}
                            <div
                                style={{
                                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorBgContainer,
                                    padding: '14px 24px 16px',
                                    flexShrink: 0, maxHeight: '40%',
                                    display: 'flex', flexDirection: 'column',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <AppstoreAddOutlined style={{ color: token.colorTextSecondary }} />
                                    <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Available to add</Text>
                                    <Tag style={{ fontSize: 11, margin: 0 }}>{availableItems.length}</Tag>
                                    <div style={{ flex: 1 }} />
                                    {availableItems.length > 0 && (
                                        <Input
                                            allowClear
                                            size="small"
                                            placeholder="Search…"
                                            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                                            value={availSearch}
                                            onChange={(e) => setAvailSearch(e.target.value)}
                                            style={{ width: 200, borderRadius: 8 }}
                                        />
                                    )}
                                </div>

                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {itemsLoading ? (
                                        <Skeleton active paragraph={{ rows: 2 }} />
                                    ) : availableItems.length === 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                                            <CheckCircleFilled style={{ color: '#52c41a' }} />
                                            <Text type="secondary" style={{ fontSize: 13 }}>Every item is already in this category.</Text>
                                        </div>
                                    ) : visibleAvailable.length === 0 ? (
                                        <Text type="secondary" style={{ fontSize: 13 }}>No items match your search.</Text>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                                            {visibleAvailable.map((item) => {
                                                const busy = assigningId === item.id;
                                                const disabled = updateItem.isPending && !busy;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() => handleAssignItem(item)}
                                                        style={{
                                                            textAlign: 'left', font: 'inherit', padding: 14, borderRadius: 12,
                                                            border: `1px dashed ${token.colorBorder}`,
                                                            background: token.colorBgContainer,
                                                            display: 'flex', gap: 12, alignItems: 'center',
                                                            cursor: disabled ? 'not-allowed' : 'pointer',
                                                            opacity: disabled ? 0.55 : 1,
                                                            transition: 'border-color 0.15s, background 0.15s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (disabled) return;
                                                            const el = e.currentTarget as HTMLButtonElement;
                                                            el.style.borderColor = BRAND;
                                                            el.style.borderStyle = 'solid';
                                                            el.style.background = token.colorPrimaryBg;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const el = e.currentTarget as HTMLButtonElement;
                                                            el.style.borderColor = token.colorBorder;
                                                            el.style.borderStyle = 'dashed';
                                                            el.style.background = token.colorBgContainer;
                                                        }}
                                                    >
                                                        <Avatar shape="square" size={40} style={{ background: token.colorFillSecondary, color: token.colorTextSecondary, flexShrink: 0, borderRadius: 10, fontWeight: 700 }}>
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <Text strong style={{ fontSize: 13.5, ...TRUNC }} title={item.name}>{item.name}</Text>
                                                            <Text type="secondary" style={{ fontSize: 11, marginTop: 2, ...TRUNC }} title={`Currently in ${catNameOf(item.categoryId)}`}>
                                                                in {catNameOf(item.categoryId)}
                                                            </Text>
                                                        </div>
                                                        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: BRAND, fontSize: 12.5, fontWeight: 600 }}>
                                                            <PlusOutlined spin={busy} style={{ fontSize: 12 }} />
                                                            Add
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {availableHiddenCount > 0 && (
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
                                            Showing {visibleAvailable.length} of {filteredAvailable.length}. Search to narrow down the remaining {availableHiddenCount}.
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            <Modal
                title={editingCat ? 'Edit Category' : 'Create Category'}
                open={isModalOpen}
                onOk={handleSave}
                confirmLoading={createCategory.isPending || updateCategory.isPending}
                onCancel={() => setIsModalOpen(false)}
                width={600}
                forceRender
            >
                <Form form={form} name="category_form" layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="name" label="Name" rules={[
                                    { required: true, message: 'Category name is required' },
                                    { pattern: /^[a-zA-Z0-9 ]+$/, message: 'Only letters, numbers, and spaces are allowed' }
                                  ]}>
                        <Input placeholder="e.g. Beverages" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="isActive" label="Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                    <Form.Item name="taxIds" label="Applicable Taxes">
                        <Select
                            mode="multiple"
                            placeholder="Select taxes"
                            optionFilterProp="label"
                            options={taxes.map(t => ({ value: t.id, label: `${t.name} (${t.percentage}%)` }))}
                        />
                    </Form.Item>
                    <Form.Item name="kitchenDisplayIds" label="KDS Routing">
                        <Select
                            mode="multiple"
                            placeholder="Select KDS screens"
                            optionFilterProp="label"
                            options={kdsScreens.map(d => ({ value: d.id, label: d.name }))}
                        />
                    </Form.Item>
                    <Form.Item name="printerIds" label="Printer Routing">
                        <Select
                            mode="multiple"
                            placeholder="Select printers"
                            optionFilterProp="label"
                            options={printers.map(d => ({ value: d.id, label: d.name }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryView;
