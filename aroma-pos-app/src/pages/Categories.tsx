import React from 'react';
import CategoryView from '../features/catalog/components/CategoryView';
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useDevices,
    useTaxes,
} from '../features/catalog/hooks/useMenuPageData';
import { useMenuItems, useUpdateMenuItem } from '../features/catalog/hooks/useMenuItems';

const Categories: React.FC = () => {
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { data: devices = [], isLoading: loadingDevices } = useDevices();
    const { data: taxes = [], isLoading: loadingTaxes } = useTaxes();
    const { data: items = [], isLoading: loadingItems, isFetching: fetchingItems } = useMenuItems();

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const updateItem = useUpdateMenuItem();

    return (
        <CategoryView
            categories={categories}
            devices={devices}
            taxes={taxes}
            items={items}
            isLoading={loadingCategories || loadingDevices || loadingTaxes}
            itemsLoading={loadingItems}
            itemsFetching={fetchingItems}
            createCategory={createCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
            updateItem={updateItem}
        />
    );
};

export default Categories;
