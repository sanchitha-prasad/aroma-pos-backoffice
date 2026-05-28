import React, { useState, useEffect } from 'react';
import { message, Modal, Spin } from 'antd';
import ModifierManagementView from '../features/catalog/components/ModifierManagementView';
import { ModifierGroup, Modifier } from '../shared/types';
import { ModifiersService } from '../features/catalog/api/modifiers.service';
import { ModifierGroupsService } from '../features/catalog/api/ModifierGroups.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';

const Modifiers: React.FC = () => {
    const [groups, setGroups] = useState<ModifierGroup[]>([]);
    const [modifiers, setModifiers] = useState<Modifier[]>([]);
    const [loading, setLoading] = useState(true);

    const[popup, contextHolder] = Modal.useModal();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [grpData, modData] = await Promise.all([
                ModifierGroupsService.getModifierGroups(),
                ModifiersService.getModifiers()
            ]);
            if (grpData.success){
                setGroups(grpData.data ?? []);
            }else{
                showErrorMessage(popup, grpData.message, "Modifier Group Fetch Failed");
            }
            if(modData.success){
                setModifiers(modData.data ?? []);
            }else{
                showErrorMessage(popup, modData.message, "Modifier Fetch Failed");
            }
        } catch (error) {
            message.error("Failed to load modifiers");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchData();
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (
        <>
        {contextHolder}
        <ModifierManagementView
            allModifiers={modifiers}
            allGroups={groups}
            onModifierChange={handleRefresh}
        />
        </>
    );
};

export default Modifiers;