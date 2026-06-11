import React, { useState, useEffect, useMemo } from 'react';
import { Button, Typography, theme, Select, Input, Tree, Space, Tag, Divider, Tabs, Empty, Spin } from 'antd';
import { SaveOutlined, ExpandAltOutlined, CompressOutlined, CaretRightOutlined, ShopOutlined, DesktopOutlined } from '@ant-design/icons';
import { Role, Permission } from '../../../shared/types';
import { APPLICATIONS, APP_LABELS, ROLES } from '../../../shared/constants';
import { usePermissions } from '../../../shared/hooks/usePermissions';

const { Title, Text } = Typography;
const { Search } = Input;

interface RolePermissionsViewProps {
    rolePermissions: Record<Role, string[]>;
    onSave: (updatedPermissions: Record<Role, string[]>) => void;
}

const groupKey = (group: string) => `group-${group}`;
const defaultSubGroup = '__default__';
const subGroupKey = (group: string, subGroup: string) => `subgroup-${group}-${subGroup}`;

const RolePermissionsView: React.FC<RolePermissionsViewProps> = ({ rolePermissions, onSave }) => {
    const { token } = theme.useToken();

    const { data: allPermissionsData = [], isLoading: permissionsLoading } = usePermissions();

    const [permissions, setPermissions] = useState<Record<Role, string[]>>(rolePermissions);
    const [activeApp, setActiveApp] = useState<'POS' | 'BackOffice'>('BackOffice');
    const [selectedRole, setSelectedRole] = useState<Role>('Manager');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setPermissions(rolePermissions);
        setHasChanges(false);
    }, [rolePermissions]);

    const filteredPermissions = useMemo(() => {
        return allPermissionsData.filter(perm => (perm.application || 'BackOffice') === activeApp);
    }, [activeApp, allPermissionsData]);

    const groupedPermissions = useMemo<Record<string, Record<string, Permission[]>>>(() => {
        return filteredPermissions.reduce((acc, perm) => {
            const subGroup = perm.subGroup || defaultSubGroup;
            acc[perm.group] = acc[perm.group] || {};
            acc[perm.group][subGroup] = acc[perm.group][subGroup] || [];
            acc[perm.group][subGroup].push(perm);
            return acc;
        }, {} as Record<string, Record<string, Permission[]>>);
    }, [filteredPermissions]);

    const filteredGroupedPermissions = useMemo<Record<string, Record<string, Permission[]>>>(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return groupedPermissions;
        }

        return Object.fromEntries(
            Object.entries(groupedPermissions)
                .map(([group, subGroups]) => [
                    group,
                    Object.fromEntries(
                        Object.entries(subGroups)
                            .map(([subGroup, perms]) => [
                                subGroup,
                                perms.filter(perm =>
                                    perm.label.toLowerCase().includes(normalizedSearch) ||
                                    perm.key.toLowerCase().includes(normalizedSearch)
                                )
                            ])
                            .filter(([_subGroup, perms]) => perms.length > 0)
                    )
                ])
                .filter(([_group, subGroups]) => Object.keys(subGroups).length > 0)
        ) as Record<string, Record<string, Permission[]>>;
    }, [groupedPermissions, searchTerm]);

    const roles = ROLES;
    const selectedPermissions = permissions[selectedRole] || [];

    const groupStates = useMemo(() => {
        const checked: string[] = [];
        const halfChecked: string[] = [];

        Object.entries(filteredGroupedPermissions).forEach(([group, subGroups]) => {
            const allPerms = Object.values(subGroups).flat();
            const selectedCount = allPerms.filter(p => selectedPermissions.includes(p.key)).length;
            const key = groupKey(group);
            if (selectedCount === allPerms.length && allPerms.length > 0) {
                checked.push(key);
            } else if (selectedCount > 0) {
                halfChecked.push(key);
            }
        });

        return { checked, halfChecked };
    }, [filteredGroupedPermissions, selectedPermissions]);

    const subGroupStates = useMemo(() => {
        const checked: string[] = [];
        const halfChecked: string[] = [];

        Object.entries(filteredGroupedPermissions).forEach(([group, subGroups]) => {
            Object.entries(subGroups).forEach(([subGroup, perms]) => {
                if (subGroup === defaultSubGroup) return;
                const selectedCount = perms.filter(p => selectedPermissions.includes(p.key)).length;
                const key = subGroupKey(group, subGroup);
                if (selectedCount === perms.length && perms.length > 0) {
                    checked.push(key);
                } else if (selectedCount > 0) {
                    halfChecked.push(key);
                }
            });
        });

        return { checked, halfChecked };
    }, [filteredGroupedPermissions, selectedPermissions]);

    const togglePermission = (permissionKey: string, checked: boolean) => {
        setPermissions(prev => {
            const currentRolePerms = prev[selectedRole] || [];
            const nextPerms = checked
                ? Array.from(new Set([...currentRolePerms, permissionKey]))
                : currentRolePerms.filter(key => key !== permissionKey);

            return {
                ...prev,
                [selectedRole]: nextPerms,
            };
        });
        setHasChanges(true);
    };

    const toggleGroup = (group: string, checked: boolean) => {
        const groupPerms = Object.values(filteredGroupedPermissions[group] || {}).flat().map(p => p.key);
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: checked
                ? Array.from(new Set([...(prev[selectedRole] || []), ...groupPerms]))
                : (prev[selectedRole] || []).filter(key => !groupPerms.includes(key)),
        }));
        setHasChanges(true);
        if (checked) {
            const subgroupKeys = Object.keys(filteredGroupedPermissions[group] || {})
                .filter(sg => sg !== defaultSubGroup)
                .map(sg => subGroupKey(group, sg));
            const keysToAdd = [groupKey(group), ...subgroupKeys];
            setExpandedKeys(prev => Array.from(new Set([...prev, ...keysToAdd])));
        }
    };

    const toggleSubGroup = (group: string, subGroup: string, checked: boolean) => {
        const subGroupPerms = (filteredGroupedPermissions[group]?.[subGroup] || []).map(p => p.key);
        setPermissions(prev => ({
            ...prev,
            [selectedRole]: checked
                ? Array.from(new Set([...(prev[selectedRole] || []), ...subGroupPerms]))
                : (prev[selectedRole] || []).filter(key => !subGroupPerms.includes(key)),
        }));
        setHasChanges(true);
        if (checked) {
            setExpandedKeys(prev => Array.from(new Set([...prev, subGroupKey(group, subGroup)])));
        }
    };

    const treeData = useMemo<any[]>(() => {
        return Object.entries(filteredGroupedPermissions).map(([group, subGroups]) => {
            const allPerms = Object.values(subGroups).flat();
            const selectedCount = allPerms.filter(p => selectedPermissions.includes(p.key)).length;
            const allSelected = selectedCount === allPerms.length && allPerms.length > 0;

            return {
                title: (
                    <div onClick={(e) => { e.stopPropagation(); toggleExpandKey(groupKey(group)); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12, padding: '10px 12px', borderBottom: `1px solid ${token.colorBorder}`, cursor: 'pointer' }}>
                        <div>
                            <Text strong style={{ fontSize: 14 }}>{group} Module</Text>
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {selectedCount} of {allPerms.length} permissions selected
                                </Text>
                            </div>
                        </div>
                        <Tag style={{ fontSize: 12, padding: '0 8px' }} color={allSelected ? 'green' : selectedCount > 0 ? 'gold' : 'default'}>
                            {selectedCount}/{allPerms.length}
                        </Tag>
                    </div>
                ),
                key: groupKey(group),
                children: Object.entries(subGroups).reduce<any[]>((children, [subGroup, perms]) => {
                    if (subGroup === defaultSubGroup) {
                        return children.concat(perms.map(permission => ({
                            title: (
                                <div style={{ paddingLeft: 6 }}>
                                    <div style={{ fontWeight: 500 }}>{permission.label}</div>
                                    {permission.description && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>{permission.description}</Text>
                                    )}
                                </div>
                            ),
                            key: permission.key,
                            isLeaf: true,
                        })));
                    }

                    const subSelectedCount = perms.filter(p => selectedPermissions.includes(p.key)).length;
                    const subAllSelected = subSelectedCount === perms.length && perms.length > 0;

                    return children.concat({
                        title: (
                            <div onClick={(e) => { e.stopPropagation(); toggleExpandKey(subGroupKey(group, subGroup)); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 12, padding: '8px 12px', cursor: 'pointer' }}>
                                <div>
                                    <Text strong style={{ fontSize: 13 }}>{subGroup}</Text>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {subSelectedCount} of {perms.length} permissions selected
                                        </Text>
                                    </div>
                                </div>
                                <Tag style={{ fontSize: 12, padding: '0 8px' }} color={subAllSelected ? 'green' : subSelectedCount > 0 ? 'gold' : 'default'}>
                                    {subSelectedCount}/{perms.length}
                                </Tag>
                            </div>
                        ),
                        key: subGroupKey(group, subGroup),
                        children: perms.map(permission => ({
                            title: (
                                <div style={{ paddingLeft: 6 }}>
                                    <div style={{ fontWeight: 500 }}>{permission.label}</div>
                                    {permission.description && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>{permission.description}</Text>
                                    )}
                                </div>
                            ),
                            key: permission.key,
                            isLeaf: true,
                        })),
                    });
                }, []),
            };
        });
    }, [filteredGroupedPermissions, selectedPermissions]);

    const handleTreeCheck = (_checkedKeysValue: any, info: any) => {
        const nodeKey = info.node.key as string;
        const checked = info.checked;

        if (nodeKey.startsWith('group-')) {
            const group = nodeKey.replace(/^group-/, '');
            toggleGroup(group, checked);
        } else if (nodeKey.startsWith('subgroup-')) {
            const rest = nodeKey.substring('subgroup-'.length);
            const splitIndex = rest.indexOf('-');
            if (splitIndex === -1) {
                return;
            }
            const groupName = rest.substring(0, splitIndex);
            const subGroupName = rest.substring(splitIndex + 1);
            toggleSubGroup(groupName, subGroupName, checked);
        } else {
            togglePermission(nodeKey, checked);
        }
    };

    const handleSave = () => {
        onSave(permissions);
        setHasChanges(false);
    };

    const handleAppChange = (app: string) => {
        setActiveApp(app as 'POS' | 'BackOffice');
    };

    const handleRoleChange = (role: Role) => {
        setSelectedRole(role);
    };

    const handleExpandAll = () => setExpandedKeys([
        ...Object.keys(filteredGroupedPermissions).map(groupKey),
        ...Object.entries(filteredGroupedPermissions).flatMap(([group, subGroups]) =>
            Object.keys(subGroups)
                .filter(subGroup => subGroup !== defaultSubGroup)
                .map(subGroup => subGroupKey(group, subGroup))
        )
    ]);
    const handleCollapseAll = () => setExpandedKeys([]);

    const toggleExpandKey = (key: string) => {
        setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    return (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 280, flex: 1 }}>
                    <Title level={2} style={{ margin: 0 }}>Roles & Permissions</Title>
                    <Text type="secondary">Manage access levels for different staff roles grouped by module.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    disabled={!hasChanges}
                    style={{ opacity: hasChanges ? 1 : 0.7, minWidth: 150 }}
                >
                    Save Changes
                </Button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ minWidth: 280, flex: 1, maxWidth: 420 }}>
                    <Text strong>Select Role</Text>
                    <div style={{ marginTop: 8 }}>
                        <Select<Role>
                            value={selectedRole}
                            onChange={value => handleRoleChange(value)}
                            options={roles.map(role => ({ label: role, value: role }))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <Button icon={<ExpandAltOutlined />} onClick={handleExpandAll}>Expand All</Button>
                    <Button icon={<CompressOutlined />} onClick={handleCollapseAll}>Collapse All</Button>
                </div>

                <div style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
                    <Search
                        allowClear
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: token.colorBgContainer, borderRadius: 12, padding: 16, minHeight: 0 }}>
                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                    <Tabs
                        activeKey={activeApp}
                        onChange={handleAppChange}
                        items={APPLICATIONS.map(app => ({
                            key: app,
                            label: APP_LABELS[app],
                            icon: app === 'POS' ? <ShopOutlined /> : <DesktopOutlined />,
                        }))}
                        style={{ background: token.colorBgContainer, borderRadius: 8, padding: '4px 8px' }}
                        tabBarStyle={{ padding: 0, margin: 0 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: token.colorFillAlter, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#7c3aed' }} />
                        <Text style={{ color: token.colorTextSecondary, fontSize: 12, lineHeight: 1.2 }}>
                            {activeApp === 'POS'
                                ? 'Configure permissions for the POS application.'
                                : 'Configure permissions for the Back Office application.'}
                        </Text>
                    </div>
                    <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 14 }}>Permissions Tree</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>Expand modules to manage subgroup and permission access.</Text>
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {treeData.length === 0 ? (
                        <Empty description={`No permissions defined for ${APP_LABELS[activeApp].toLowerCase()}.`} />
                    ) : (
                        <Tree
                            blockNode
                            checkable
                            checkStrictly
                            showLine={{ showLeafIcon: false }}
                            selectable={false}
                            treeData={treeData}
                            checkedKeys={{ checked: [...selectedPermissions, ...groupStates.checked, ...subGroupStates.checked], halfChecked: [...groupStates.halfChecked, ...subGroupStates.halfChecked] }}
                            onCheck={handleTreeCheck}
                            expandedKeys={expandedKeys}
                            onExpand={keys => setExpandedKeys(keys as string[])}
                            switcherIcon={({ isLeaf, expanded }) => isLeaf ? null : <CaretRightOutlined rotate={expanded ? 90 : 0} />}
                        />
                    )}
                </div>
            </div>

            <Divider />

            <Text type="secondary" style={{ fontSize: 13 }}>
                Checking a module gives full access to all permissions under it. Uncheck to customize individual permissions.
            </Text>
        </div>
    );
};

export default RolePermissionsView;
