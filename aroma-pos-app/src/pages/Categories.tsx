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

const Categories: React.FC = () => {
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { data: devices = [], isLoading: loadingDevices } = useDevices();
    const { data: taxes = [], isLoading: loadingTaxes } = useTaxes();

    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    return (
        <CategoryView
            categories={categories}
            devices={devices}
            taxes={taxes}
            isLoading={loadingCategories || loadingDevices || loadingTaxes}
            createCategory={createCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
        />
    );
};

export default Categories;
