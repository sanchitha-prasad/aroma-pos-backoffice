import React, { useState } from 'react';
import { Table, Typography, theme, Tag, Input, Space, Avatar, Select } from 'antd';
import { SearchOutlined, UserOutlined, ClockCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { Activity } from '../../../shared/types';

const { Title } = Typography;
const { Option } = Select;

interface ActivityLogViewProps {
    activities: Activity[];
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activities }) => {
    const { token } = theme.useToken();
    const [searchText, setSearchText] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const uniqueUsers = Array.from(new Set(activities.map(a => a.user))).sort();

    const filteredActivities = activities.filter(act => {
        const matchesSearch = 
            act.user.toLowerCase().includes(searchText.toLowerCase()) ||
            act.action.toLowerCase().includes(searchText.toLowerCase()) ||
            act.target.toLowerCase().includes(searchText.toLowerCase());
            
        const matchesUser = selectedUser ? act.user === selectedUser : true;

        return matchesSearch && matchesUser;
    });

    const columns = [
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 200,
            render: (date: Date) => (
                <Space>
                    <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
                    <span style={{ color: token.colorTextSecondary }}>
                        {new Date(date).toLocaleString()}
                    </span>
                </Space>
            ),
            sorter: (a: Activity, b: Activity) => new Date(a.time).getTime() - new Date(b.time).getTime(),
            defaultSortOrder: 'descend' as const,
        },
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
            width: 200,
            render: (name: string) => (
                <Space>
                    <Avatar 
                        style={{ backgroundColor: token.colorPrimary, verticalAlign: 'middle' }} 
                        size="small"
                    >
                        {name[0].toUpperCase()}
                    </Avatar>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                </Space>
            )
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => {
                let color = 'default';
                if (action.includes('created') || action.includes('added')) color = 'success';
                if (action.includes('deleted') || action.includes('removed')) color = 'error';
                if (action.includes('updated') || action.includes('edited')) color = 'processing';
                if (action.includes('logged')) color = 'warning';

                return <Tag color={color} style={{ textTransform: 'uppercase', fontSize: 11 }}>{action}</Tag>;
            }
        },
        {
            title: 'Target / Details',
            dataIndex: 'target',
            key: 'target',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>
        }
    ];

    return (
        <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>System Activity Log</Title>
                <Space>
                    <Select
                        placeholder="Filter by User"
                        style={{ width: 200 }}
                        allowClear
                        onChange={setSelectedUser}
                        suffixIcon={<FilterOutlined />}
                    >
                        {uniqueUsers.map(user => (
                            <Option key={user} value={user}>{user}</Option>
                        ))}
                    </Select>
                    <Input 
                        placeholder="Search logs..." 
                        prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                </Space>
            </div>

            <div style={{ 
                background: token.colorBgContainer, 
                borderRadius: 12, 
                border: `1px solid ${token.colorBorderSecondary}`, 
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <Table 
                    className="custom-table"
                    dataSource={filteredActivities} 
                    columns={columns} 
                    rowKey="id" 
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                />
            </div>
        </div>
    );
};

export default ActivityLogView;