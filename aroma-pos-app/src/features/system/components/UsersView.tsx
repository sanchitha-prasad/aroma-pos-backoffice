import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, theme, Modal, Form, Input, Select, message, Popconfirm, Timeline, Empty } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined, NumberOutlined, HistoryOutlined, ShopOutlined } from '@ant-design/icons';
import { Employee, Activity, Branch } from '../../../shared/types';

const { Title, Text } = Typography;
const { Option } = Select;

interface EmployeesViewProps {
    onLogActivity: (action: string, target: string) => void;
    activities: Activity[];
    branches: Branch[];
    employees: Employee[];
    onSave: (emp: Employee) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({ onLogActivity, activities, branches, employees, onSave, onDelete }) => {
  const { token } = theme.useToken();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<Employee | null>(null);

  const [form] = Form.useForm();

  const showModal = (employee?: Employee) => {
    if (employee) {
        setEditingEmployee(employee);
        (form as any).setFieldsValue(employee);
    } else {
        setEditingEmployee(null);
        (form as any).resetFields();
        (form as any).setFieldsValue({ status: 'Active', role: 'Cashier' });
    }
    setIsModalOpen(true);
  };

  const showActivityModal = (employee: Employee) => {
      setSelectedUserForActivity(employee);
      setIsActivityModalOpen(true);
  };

  const handleDelete = (id: string) => {
      onDelete(id);
  };

  const handleOk = () => {
      (form as any).validateFields().then((values: any) => {
          const emp: Employee = {
              id: editingEmployee ? editingEmployee.id : '',
              ...values
          };
          onSave(emp);
          setIsModalOpen(false);
          if (editingEmployee) {
             onLogActivity('updated employee details for', values.name);
          } else {
             onLogActivity('added new employee', values.name);
          }
      });
  };

  const userActivities = activities.filter(a => a.user === selectedUserForActivity?.name);

  const getBranchName = (branchId?: string) => {
      if (!branchId) return <span style={{ color: '#ccc' }}>Not Assigned</span>;
      const b = branches.find(br => br.id === branchId);
      return b ? b.name : <span style={{ color: '#ccc' }}>Unknown</span>;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500, color: token.colorText }}>{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: (branchId: string) => (
          <Space size={4}>
              <ShopOutlined style={{ color: token.colorTextSecondary }} />
              {getBranchName(branchId)}
          </Space>
      )
    },
    {
      title: 'POS Login',
      dataIndex: 'loginNumber',
      key: 'loginNumber',
      render: (num: string) => <Tag icon={<NumberOutlined />} bordered={false}>{num}</Tag>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        let color = role === 'SuperAdmin' ? 'red' : role === 'Admin' ? 'purple' : role === 'Manager' ? 'blue' : 'default';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        return (
            <Space>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: status === 'Active' ? '#52c41a' : '#d9d9d9' }} />
                <span>{status}</span>
            </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<HistoryOutlined style={{ color: token.colorInfo }} />} 
            onClick={() => showActivityModal(record)} 
            title="View History"
          />
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: token.colorPrimary }} />} 
            onClick={() => showModal(record)} 
            title="Edit"
          />
          <Popconfirm title="Delete employee?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
            <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', padding: 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
         <Title level={2} style={{ margin: 0 }}>Staff Management</Title>
         <Button type="primary" icon={<UserAddOutlined />} onClick={() => showModal()}>Add Employee</Button>
      </div>
      
      <div style={{ background: token.colorBgContainer, borderRadius: 8, overflow: 'hidden', border: `1px solid ${token.colorBorder}` }}>
        <Table 
            className="custom-table"
            dataSource={employees} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal 
        title={editingEmployee ? "Edit Employee" : "Add New Employee"} 
        open={isModalOpen} 
        onOk={handleOk} 
        onCancel={() => setIsModalOpen(false)}
      >
          <Form form={form} layout="vertical">
              <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. John Doe" />
              </Form.Item>
              <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                  <Input placeholder="john@restaurant.com" />
              </Form.Item>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password is required' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="******" />
                </Form.Item>
                <Form.Item name="loginNumber" label="POS Login PIN" rules={[{ required: true, message: 'Login PIN is required' }]}>
                    <Input prefix={<NumberOutlined />} placeholder="e.g. 1001" maxLength={6} />
                </Form.Item>
              </div>

              <Form.Item name="branchId" label="Assigned Branch" rules={[{ required: true }]}>
                  <Select placeholder="Select a branch">
                      {branches.map(b => (
                          <Option key={b.id} value={b.id}>{b.name}</Option>
                      ))}
                  </Select>
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                    <Select>
                        <Option value="SuperAdmin">Super Admin</Option>
                        <Option value="Admin">Admin</Option>
                        <Option value="Manager">Manager</Option>
                        <Option value="Cashier">Cashier</Option>
                        <Option value="Waiter">Waiter</Option>
                        <Option value="Kitchen">Kitchen</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                    <Select>
                        <Option value="Active">Active</Option>
                        <Option value="Inactive">Inactive</Option>
                    </Select>
                </Form.Item>
              </div>
          </Form>
      </Modal>

      <Modal
        title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HistoryOutlined />
                <span>Activity History: {selectedUserForActivity?.name}</span>
            </div>
        }
        open={isActivityModalOpen}
        footer={null}
        onCancel={() => setIsActivityModalOpen(false)}
        width={600}
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '24px' }}
      >
        {userActivities.length > 0 ? (
            <Timeline
                items={userActivities.map(act => ({
                    children: (
                        <div>
                            <Text strong>{act.action}</Text> <Text>{act.target}</Text>
                            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                                {new Date(act.time).toLocaleString()}
                            </div>
                        </div>
                    ),
                    color: 'purple'
                }))}
            />
        ) : (
            <Empty description="No recent activity found for this user." />
        )}
      </Modal>
    </div>
  );
};

export default EmployeesView;