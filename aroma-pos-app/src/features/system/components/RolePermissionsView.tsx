import React, { useState, useEffect } from 'react';
import { Table, Checkbox, Button, Typography, theme, message, Alert, Collapse } from 'antd';
import { SaveOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Role, Permission } from '../../../shared/types';
import { ALL_PERMISSIONS } from '../../../shared/constants';

const { Title, Text } = Typography;

interface RolePermissionsViewProps {
    rolePermissions: Record<Role, string[]>;
    onSave: (updatedPermissions: Record<Role, string[]>) => void;
}

const RolePermissionsView: React.FC<RolePermissionsViewProps> = ({ rolePermissions, onSave }) => {
    const { token } = theme.useToken();
    
    const [permissions, setPermissions] = useState<Record<Role, string[]>>(rolePermissions);
    const [hasChanges, setHasChanges] = useState(false);

    const roles: Role[] = ['SuperAdmin', 'Admin', 'Manager'];

    useEffect(() => {
        setPermissions(rolePermissions);
        setHasChanges(false);
    }, [rolePermissions]);

    const handleToggle = (role: Role, permissionKey: string, checked: boolean) => {
        setPermissions(prev => {
            const currentRolePerms = prev[role] || [];
            let newRolePerms;
            if (checked) {
                newRolePerms = [...currentRolePerms, permissionKey];
            } else {
                newRolePerms = currentRolePerms.filter(k => k !== permissionKey);
            }
            return {
                ...prev,
                [role]: newRolePerms
            };
        });
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(permissions);
        setHasChanges(false);
        message.success("Permissions updated successfully");
    };

    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.group]) {
            acc[perm.group] = [];
        }
        acc[perm.group].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const groupKeys = Object.keys(groupedPermissions);

    const columns = [
        {
            title: 'Permission',
            dataIndex: 'label',
            key: 'label',
            render: (text: string, record: Permission) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    {record.description && <Text type="secondary" style={{ fontSize: 11 }}>{record.description}</Text>}
                </div>
            )
        },
        ...roles.map(role => ({
            title: role,
            key: role,
            align: 'center' as const,
            width: 100,
            render: (_: any, record: Permission) => {
                const isChecked = permissions[role]?.includes(record.key);
                
                const isDisabled = role === 'SuperAdmin';

                return (
                    <Checkbox 
                        checked={isChecked} 
                        disabled={isDisabled}
                        onChange={e => handleToggle(role, record.key, e.target.checked)}
                    />
                );
            }
        }))
    ];

    const collapseItems = groupKeys.map(group => ({
        key: group,
        label: (
            <span style={{ fontWeight: 600, fontSize: 15, color: token.colorTextHeading }}>
                {group} Module
            </span>
        ),
        style: {
            background: token.colorBgContainer,
            marginBottom: 16,
            borderRadius: 8,
            border: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden'
        },
        children: (
            <Table 
                className="custom-table"
                dataSource={groupedPermissions[group]} 
                columns={columns} 
                rowKey="key" 
                pagination={false}
                size="small"
            />
        )
    }));

    return (
        <div style={{ 
            padding: 24, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Roles & Permissions</Title>
                    <Text type="secondary">Manage access levels for different staff roles grouped by module.</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    disabled={!hasChanges}
                    style={{ 
                        opacity: hasChanges ? 1 : 0.7 
                    }}
                >
                    Save Changes
                </Button>
            </div>

            {hasChanges && (
                <Alert 
                    message="Unsaved Changes" 
                    description="You have modified permissions. Click 'Save Changes' to apply them." 
                    type="warning" 
                    showIcon 
                    style={{ marginBottom: 16 }} 
                />
            )}
            
            <div style={{ 
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8
            }}>
                <Collapse 
                    defaultActiveKey={groupKeys} 
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                    ghost
                    style={{ background: 'transparent' }}
                    items={collapseItems}
                />
            </div>
        </div>
    );
};

export default RolePermissionsView;