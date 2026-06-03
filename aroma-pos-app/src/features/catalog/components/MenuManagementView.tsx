import React, { useEffect, useState } from 'react';
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  theme,
  message,
} from 'antd';
import {
  AppstoreAddOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Category, MenuEntity } from '../../../shared/types';

const { Title, Text } = Typography;

interface MenuManagementViewProps {
  menus: MenuEntity[];
  categories: Category[];
  loading: boolean;
  isFetching?: boolean;
  onRefresh: () => void;
  onCreateMenu: (values: Omit<MenuEntity, 'id' | 'categories'>) => Promise<void>;
  onUpdateMenu: (id: string, values: Partial<Omit<MenuEntity, 'id' | 'categories'>>) => Promise<void>;
  onDeleteMenu: (id: string) => Promise<void>;
  onAssignCategory: (menuId: string, categoryId: string) => Promise<void>;
  onRemoveCategory: (menuId: string, categoryId: string) => Promise<void>;
}

const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  menus,
  categories,
  loading,
  isFetching,
  onRefresh,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onAssignCategory,
  onRemoveCategory,
}) => {
  const { token } = theme.useToken();

  const [selectedMenu, setSelectedMenu] = useState<MenuEntity | null>(null);
  const [formOpen, setFormOpen]         = useState(false);
  const [editingMenu, setEditingMenu]   = useState<MenuEntity | null>(null);
  const [assignOpen, setAssignOpen]     = useState(false);
  const [assignCatId, setAssignCatId]   = useState<string | undefined>(undefined);
  const [saving, setSaving]             = useState(false);

  const [form] = Form.useForm();

  // Keep selectedMenu in sync when TanStack Query refreshes the list
  useEffect(() => {
    if (selectedMenu) {
      const refreshed = menus.find((m) => m.id === selectedMenu.id);
      setSelectedMenu(refreshed ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus]);

  const assignedIds = new Set((selectedMenu?.categories ?? []).map((c) => c.categoryId));
  const unassigned  = categories.filter((c) => !assignedIds.has(c.id));
  const getCatName  = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getCat      = (id: string) => categories.find((c) => c.id === id);

  // ── Menu CRUD ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setFormOpen(true);
  };

  const openEdit = (menu: MenuEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMenu(menu);
    form.setFieldsValue({ title: menu.title, subtitle: menu.subtitle, isActive: menu.isActive });
    setFormOpen(true);
  };

  const handleSaveMenu = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingMenu) {
        await onUpdateMenu(editingMenu.id, values);
        message.success('Menu updated');
      } else {
        await onCreateMenu(values);
        message.success('Menu created');
      }
      setFormOpen(false);
    } catch {
      // axios interceptor already shows a toast
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await onDeleteMenu(id);
      if (selectedMenu?.id === id) setSelectedMenu(null);
      message.success('Menu deleted');
    } catch {
      // axios interceptor already shows a toast
    }
  };

  // ── Category assignment ───────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (!selectedMenu || !assignCatId) return;
    try {
      await onAssignCategory(selectedMenu.id, assignCatId);
      setAssignOpen(false);
      setAssignCatId(undefined);
      message.success(`"${getCatName(assignCatId)}" assigned`);
    } catch {
      // axios interceptor already shows a toast
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!selectedMenu) return;
    try {
      await onRemoveCategory(selectedMenu.id, categoryId);
      message.success(`"${getCatName(categoryId)}" removed`);
    } catch {
      // axios interceptor already shows a toast
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', gap: 20, overflow: 'hidden' }}>

      {/* ── Left: Menu list ── */}
      <div
        style={{
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Space>
            <ReadOutlined style={{ color: token.colorPrimary }} />
            <Text strong>Menus</Text>
            <Tag style={{ fontSize: 11, margin: 0 }}>{menus.length}</Tag>
          </Space>
          <Space size={4}>
            <Button size="small" icon={<ReloadOutlined spin={isFetching} />} onClick={onRefresh} loading={isFetching} />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
              New
            </Button>
          </Space>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loading ? (
            [1, 2, 3].map((n) => (
              <Skeleton key={n} active paragraph={{ rows: 1 }} style={{ margin: '8px 4px' }} />
            ))
          ) : menus.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No menus yet" style={{ marginTop: 40 }} />
          ) : (
            menus.map((menu) => {
              const sel = selectedMenu?.id === menu.id;
              return (
                <div
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: sel
                      ? `linear-gradient(90deg, #f5f0ff 0%, ${token.colorBgContainer} 100%)`
                      : token.colorBgContainer,
                    border: `1px solid ${sel ? '#6132C0' : token.colorBorderSecondary}`,
                    borderLeft: `3px solid ${sel ? '#6132C0' : 'transparent'}`,
                    marginBottom: 8,
                    transition: 'all 0.15s',
                    boxShadow: sel ? '0 2px 8px rgba(97,50,192,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onMouseEnter={(e) => { if (!sel) { (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#6132C040'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; } }}
                  onMouseLeave={(e) => { if (!sel) { (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {menu.isActive
                          ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 13, flexShrink: 0 }} />
                          : <CloseCircleFilled style={{ color: token.colorTextQuaternary, fontSize: 13, flexShrink: 0 }} />
                        }
                        <Text
                          strong ellipsis
                          style={{ fontSize: 15, color: sel ? '#6132C0' : token.colorText }}
                        >
                          {menu.title}
                        </Text>
                      </div>
                      {menu.subtitle && (
                        <Text type="secondary" style={{ fontSize: 13, display: 'block', paddingLeft: 21 }}>
                          {menu.subtitle}
                        </Text>
                      )}
                      <div style={{ marginTop: 8, paddingLeft: 21 }}>
                        <Tag style={{ fontSize: 12, borderRadius: 6 }}>
                          {(menu.categories ?? []).length} {(menu.categories ?? []).length === 1 ? 'category' : 'categories'}
                        </Tag>
                      </div>
                    </div>
                    <Space size={0} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                      <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined style={{ color: '#6132C0' }} />} onClick={(e) => openEdit(menu, e)} />
                      </Tooltip>
                      <Popconfirm title="Delete this menu?" description="Category assignments will also be removed." onConfirm={() => handleDeleteMenu(menu.id)} okButtonProps={{ danger: true }}>
                        <Tooltip title="Delete">
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Selected menu detail ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedMenu ? (
          <div
            style={{
              flex: 1, height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: token.colorBgContainer,
              borderRadius: 12,
              border: `1px dashed ${token.colorBorderSecondary}`,
              gap: 12,
            }}
          >
            <FolderOpenOutlined style={{ fontSize: 52, color: token.colorTextQuaternary }} />
            <Text type="secondary">Select a menu on the left to manage its categories</Text>
            <Button type="dashed" icon={<PlusOutlined />} onClick={openCreate}>Create your first menu</Button>
          </div>
        ) : (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: token.colorBgContainer,
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: 'hidden',
            }}
          >
            {/* Detail header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <Space align="center" style={{ marginBottom: 2 }}>
                  <Title level={4} style={{ margin: 0 }}>{selectedMenu.title}</Title>
                  <Tag color={selectedMenu.isActive ? 'green' : 'default'}>
                    {selectedMenu.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </Space>
                {selectedMenu.subtitle && (
                  <Text type="secondary" style={{ fontSize: 13 }}>{selectedMenu.subtitle}</Text>
                )}
              </div>
              <Button
                type="primary"
                icon={<AppstoreAddOutlined />}
                onClick={() => { setAssignCatId(undefined); setAssignOpen(true); }}
                disabled={unassigned.length === 0}
              >
                Assign Category
              </Button>
            </div>

            {/* Category section label */}
            <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TagsOutlined style={{ color: token.colorTextSecondary }} />
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Assigned Categories
              </Text>
              <Tag style={{ fontSize: 11, margin: 0 }}>{(selectedMenu.categories ?? []).length}</Tag>
            </div>

            {/* Category grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
              {(selectedMenu.categories ?? []).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories assigned yet" />
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)} disabled={categories.length === 0}>
                    Assign First Category
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: 12,
                  }}
                >
                  {(selectedMenu.categories ?? []).map((mc) => {
                    const cat = getCat(mc.categoryId);
                    return (
                      <div
                        key={mc.categoryId}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 10,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          background: token.colorFillQuaternary,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = token.colorPrimaryBorder;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 8px ${token.colorPrimaryBg}`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = token.colorBorderSecondary;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13, display: 'block' }}>
                            {cat?.name ?? getCatName(mc.categoryId)}
                          </Text>
                          {cat?.description && (
                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                              {cat.description}
                            </Text>
                          )}
                          {cat?.isActive === false && (
                            <Tag color="orange" style={{ marginTop: 6, fontSize: 10 }}>Inactive</Tag>
                          )}
                        </div>
                        <Popconfirm
                          title="Remove from menu?"
                          onConfirm={() => handleRemoveCategory(mc.categoryId)}
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Remove">
                            <Button
                              type="text" size="small"
                              icon={<MinusCircleOutlined style={{ color: token.colorTextTertiary, fontSize: 15 }} />}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        title={editingMenu ? 'Edit Menu' : 'Create Menu'}
        open={formOpen}
        onOk={handleSaveMenu}
        okButtonProps={{ loading: saving }}
        onCancel={() => setFormOpen(false)}
        width={460}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Menu Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g. Breakfast Menu" size="large" />
          </Form.Item>
          <Form.Item name="subtitle" label="Subtitle (optional)">
            <Input placeholder="e.g. Served 6am – 11am" />
          </Form.Item>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Assign Category Modal ── */}
      <Modal
        title="Assign Category"
        open={assignOpen}
        onOk={handleAssign}
        onCancel={() => setAssignOpen(false)}
        okText="Assign"
        okButtonProps={{ disabled: !assignCatId }}
        width={400}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Add a category to <Text strong>{selectedMenu?.title}</Text>
          </Text>
          <Select
            style={{ width: '100%' }}
            size="large"
            placeholder="Search and select category…"
            value={assignCatId}
            onChange={setAssignCatId}
            showSearch
            optionFilterProp="label"
            options={unassigned.map((c) => ({ value: c.id, label: c.name }))}
          />
          {unassigned.length === 0 && (
            <Text type="secondary" style={{ marginTop: 10, display: 'block', fontSize: 12 }}>
              All categories are already assigned to this menu.
            </Text>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MenuManagementView;
