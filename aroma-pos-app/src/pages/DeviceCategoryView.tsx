import React from 'react';
import DeviceCategoryViewComponent from '../features/system/components/DeviceCategoryView';
import { useDevices } from '../features/system/hooks/useDevices';
import { useCategories, useUpdateCategory } from '../features/catalog/hooks/useMenuPageData';

const DeviceCategoryView: React.FC = () => {
    const { data: devices = [], isLoading: loadingDevices } = useDevices();
    const { data: categories = [], isLoading: loadingCategories } = useCategories();

    return (
        <DeviceCategoryViewComponent
            devices={devices}
            categories={categories}
            isLoading={loadingDevices || loadingCategories}
        />
    );
};

export default DeviceCategoryView;
