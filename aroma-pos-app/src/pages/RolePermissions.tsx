import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import RolePermissionsView from '../features/system/components/RolePermissionsView';
import { Role } from '../shared/types';
import { systemService } from '../features/system/api/system.service';
import { DEFAULT_ROLE_PERMISSIONS } from '../shared/constants';

const RolePermissions: React.FC = () => {
    const [rolePermissions, setRolePermissions] = useState<Record<Role, string[]>>(DEFAULT_ROLE_PERMISSIONS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // const data = await systemService.getPermissions();
            // setRolePermissions(data);
        } catch (error) {
            message.error("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedPermissions: Record<Role, string[]>) => {
        try {
            // await systemService.updatePermissions(updatedPermissions);
            setRolePermissions(updatedPermissions);
        } catch (error) {
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return <RolePermissionsView rolePermissions={rolePermissions} onSave={handleSave} />;
};

export default RolePermissions;