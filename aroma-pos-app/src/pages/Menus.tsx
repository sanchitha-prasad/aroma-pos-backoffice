import React from 'react';
import { Typography } from 'antd';
import MenuManagementView from '../features/catalog/components/MenuManagementView';
import {
    useMenus,
    useCreateMenu,
    useUpdateMenu,
    useDeleteMenu,
} from '../features/catalog/hooks/useMenus';
import { useCategories } from '../features/catalog/hooks/useMenuPageData';

const { Title } = Typography;

const Menus: React.FC = () => {
    const { data: menus = [], isLoading, isFetching, refetch } = useMenus();
    const { data: categories = [], isLoading: loadingCats }    = useCategories();

    const createMenu = useCreateMenu();
    const updateMenu = useUpdateMenu();
    const deleteMenu = useDeleteMenu();

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
            <Title level={2} style={{ margin: 0 }}>Menu Management</Title>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MenuManagementView
                    menus={menus}
                    categories={categories}
                    loading={isLoading || loadingCats}
                    isFetching={isFetching}
                    onRefresh={refetch}
                    onCreateMenu={(values) => createMenu.mutateAsync(values)}
                    onUpdateMenu={(id, values) => updateMenu.mutateAsync({ id, data: values })}
                    onDeleteMenu={(id) => deleteMenu.mutateAsync(id)}
                />
            </div>
        </div>
    );
};

export default Menus;
