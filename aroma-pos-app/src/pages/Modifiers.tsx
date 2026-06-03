import React from 'react';
import { Spin } from 'antd';
import ModifierManagementView from '../features/catalog/components/ModifierManagementView';
import { useModifiers } from '../features/catalog/hooks/useModifiers';
import { useModifierGroups } from '../features/catalog/hooks/useModifierGroups';

const Modifiers: React.FC = () => {
    const { data: modifiers = [], isLoading: loadingModifiers } = useModifiers();
    const { data: groups = [], isLoading: loadingGroups } = useModifierGroups();

    return (
        <ModifierManagementView
            allModifiers={modifiers}
            allGroups={groups}
            isLoadingModifiers={loadingModifiers}
            isLoadingGroups={loadingGroups}
        />
    );
};

export default Modifiers;