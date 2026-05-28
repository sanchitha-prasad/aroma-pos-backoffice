import React, { useState, useEffect } from 'react';
import { Button, theme, message, Spin, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import MenuList from '../features/catalog/components/MenuList';
import MenuForm from '../features/catalog/components/MenuForm';
import { MenuItem, Category, ModifierGroup, Device, Employee } from '../shared/types';
import { systemService } from '../features/system/api/system.service';
import { DeviceSevices } from '../features/system/api/device.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';
import { ProductService } from '../features/catalog/api/product.service';
import { CategoriesService } from '../features/catalog/api/categories.service';
import { ModifierGroupsService } from '../features/catalog/api/ModifierGroups.service';

interface MenuPageProps {
  currentUser: Employee | null;
}

const Menu: React.FC<MenuPageProps> = ({ currentUser }) => {
  const { token } = theme.useToken();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [popup, contextHolder] = Modal.useModal();

  useEffect(() => {
      fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [itemsData, catsData, groupsData, devicesData] = await Promise.all([
              ProductService.getProducts(),
              CategoriesService.getCategories(),
              ModifierGroupsService.getModifierGroups(),
              DeviceSevices.getDevices()
          ]);
          if(itemsData.success){
            setMenuItems(itemsData.data ?? []);
          }else{
            showErrorMessage(popup, itemsData.message, "Menu Fetch Failed");
          }
          if(catsData.success){
            setCategories(catsData.data ?? []);
          }else{
            showErrorMessage(popup, catsData.message, "Category Fetch Failed");
          }
          if(groupsData.success){
            setModifierGroups(groupsData.data ?? []);
          }else{
            showErrorMessage(popup, groupsData.message, "Modifier Group Fetch Failed");
          }
          if(devicesData.success){
            setDevices(devicesData.data ?? []);
          }else{
            showErrorMessage(popup, devicesData.message, "Device Fetch Failed");
          }
      } catch (error) {
          message.error("Failed to load menu data");
      } finally {
          setLoading(false);
      }
  };

  const isEditing = isCreating || !!selectedItemId;
  const selectedItem = menuItems.find(p => p.id === selectedItemId) || null;

  const handleCreateNewItem = () => {
    setSelectedItemId(null);
    setIsCreating(true);
  };

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItemId(item.id);
    setIsCreating(false);
  };

  const handleSaveItem = async (itemData: Omit<MenuItem, 'id'>) => {
    try {
        if (isCreating) {
            const data = await ProductService.createProduct(itemData);
            if(data.success){
                message.success("Item created");
                fetchData(); 
            }else{
                showErrorMessage(popup, data.message, "Save Failed");
            }
            //systemService.logActivity({ action: 'created menu item', target: itemData.name, user: currentUser?.name || 'User' });
        } else if (selectedItemId) {
            const data = await ProductService.updateProduct(selectedItemId, itemData);
            if(data.success){
                message.success("Item updated");
                fetchData(); 
            }else{
                showErrorMessage(popup, data.message, "Update Failed");
            }
            //systemService.logActivity({ action: 'updated menu item', target: itemData.name, user: currentUser?.name || 'User' });
        }
        setIsCreating(false);
        setSelectedItemId(null);
    } catch (error) {
        message.error("Failed to save item");
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    try {
        await ProductService.deleteProduct(id);
        message.success("Item deleted");
        if (item) {
            systemService.logActivity({ action: 'deleted menu item', target: item.name, user: currentUser?.name || 'User' });
        }
        if (selectedItemId === id) {
            setSelectedItemId(null);
            setIsCreating(false);
        }
        setMenuItems(prev => prev.filter(p => p.id !== id));
    } catch (error) {
        message.error("Failed to delete item");
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {contextHolder}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div />
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={handleCreateNewItem}
                    size="large"
                    style={{ 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        padding: '0 24px'
                    }}
                >
                    Add New Item
                </Button>
            )}
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 24, overflow: 'hidden' }}>
            {isEditing ? (
                <>
                    <div style={{ 
                        width: 320, 
                        borderRadius: 6,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        background: token.colorBgContainer,
                        border: `1px solid ${token.colorBorder}`
                    }}>
                        <MenuList 
                            items={menuItems} 
                            categories={categories}
                            modifierGroups={modifierGroups}
                            devices={devices}
                            onEdit={handleSelectItem} 
                            onDelete={handleDeleteItem} 
                            compact={true}
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
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <MenuList 
                        items={menuItems}
                        categories={categories} 
                        modifierGroups={modifierGroups}
                        devices={devices}
                        onEdit={handleSelectItem} 
                        onDelete={handleDeleteItem}
                    />
                </div>
            )}
        </div>
    </div>
  );
};

export default Menu;