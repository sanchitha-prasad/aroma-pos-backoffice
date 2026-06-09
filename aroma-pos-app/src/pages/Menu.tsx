import React, { useState } from 'react';
import { Button, theme, message, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import MenuList from '../features/catalog/components/MenuList';
import MenuTable from '../features/catalog/components/table/MenuTable';
import MenuForm from '../features/catalog/components/MenuForm';
import type { MenuItem, Employee } from '../shared/types';
import {
    useMenuItems,
    useCreateMenuItem,
    useUpdateMenuItem,
    useDeleteMenuItem,
} from '../features/catalog/hooks/useMenuItems';
import {
    useCategories,
    useModifierGroups,
    useDevices,
} from '../features/catalog/hooks/useMenuPageData';

const { Title, Text } = Typography;

interface MenuPageProps {
    currentUser: Employee | null;
}

const Menu: React.FC<MenuPageProps> = ({ currentUser }) => {
    const { token } = theme.useToken();

    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isCreating, setIsCreating]         = useState(false);

    // ── Data queries (run in parallel) ───────────────────────────────────────
    const { data: menuItems = [],      isLoading: loadingItems,   isFetching, refetch } = useMenuItems();
    const { data: categories = [],     isLoading: loadingCats  } = useCategories();
    const { data: modifierGroups = [], isLoading: loadingMods  } = useModifierGroups();
    const { data: devices = [],        isLoading: loadingDevs  } = useDevices();

    const isLoading = loadingItems || loadingCats || loadingMods || loadingDevs;

    // ── Mutations ─────────────────────────────────────────────────────────────
    const createItem = useCreateMenuItem();
    const updateItem = useUpdateMenuItem();
    const deleteItem = useDeleteMenuItem();

    // ── Derived state ─────────────────────────────────────────────────────────
    const isEditing  = isCreating || !!selectedItemId;
    const selectedItem = menuItems.find(p => p.id === selectedItemId) ?? null;
    const canEdit    = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSelectItem = (item: MenuItem) => { setSelectedItemId(item.id); setIsCreating(false); };

    const handleSaveItem = async (itemData: Omit<MenuItem, 'id'>) => {
        try {
            if (isCreating) {
                await createItem.mutateAsync(itemData);
                message.success('Item created');
            } else if (selectedItemId) {
                await updateItem.mutateAsync({ id: selectedItemId, data: itemData });
                message.success('Item updated');
            }
            setIsCreating(false);
            setSelectedItemId(null);
        } catch {
            // axios interceptor already shows a toast — nothing extra needed
        }
    };

    const handleDeleteItem = async (id: string) => {
        const item = menuItems.find(i => i.id === id);
        try {
            await deleteItem.mutateAsync(id);
            message.success('Item deleted');
            if (selectedItemId === id) { setSelectedItemId(null); setIsCreating(false); }
        } catch {
            // axios interceptor already shows a toast
        }
    };

    // ── Toolbar (injected into RichTable) ─────────────────────────────────────
    const toolbarRight = (
        <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ReloadOutlined spin={isFetching} />} onClick={() => refetch()} loading={isFetching}>
                Refresh
            </Button>
            {canEdit && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedItemId(null); setIsCreating(true); }}>
                    Add Item
                </Button>
            )}
        </div>
    );

    return (
        <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            {/* Page header */}
            <div style={{ flexShrink: 0 }}>
                <Title level={2} style={{ margin: 0 }}>Items</Title>
                <Text type="secondary">
                    {isLoading ? 'Loading…' : `${menuItems.length} item${menuItems.length !== 1 ? 's' : ''}`}
                </Text>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: 24, overflow: 'hidden', minHeight: 0 }}>
                {isEditing ? (
                    <>
                        <div style={{
                            width: 320, flexShrink: 0,
                            borderRadius: 6, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            background: token.colorBgContainer,
                            border: `1px solid ${token.colorBorder}`,
                        }}>
                            <MenuList
                                items={menuItems}
                                categories={categories}
                                modifierGroups={modifierGroups}
                                devices={devices}
                                onEdit={handleSelectItem}
                                onDelete={handleDeleteItem}
                                compact
                                selectedId={selectedItemId}
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', height: '100%' }}>
                            <MenuForm
                                initialData={isCreating ? null : selectedItem}
                                categories={categories}
                                modifierGroups={modifierGroups}
                                devices={devices}
                                onSave={handleSaveItem}
                                onCancel={() => { setIsCreating(false); setSelectedItemId(null); }}
                                onDelete={handleDeleteItem}
                            />
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                        <MenuTable
                            items={menuItems}
                            categories={categories}
                            modifierGroups={modifierGroups}
                            devices={devices}
                            isLoading={isLoading}
                            onEdit={handleSelectItem}
                            onDelete={handleDeleteItem}
                            toolbarRight={toolbarRight}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Menu;
