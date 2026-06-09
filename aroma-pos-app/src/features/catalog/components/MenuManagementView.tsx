import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
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
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MinusCircleOutlined,
  PauseCircleFilled,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Category, MenuEntity } from '../../../shared/types';

const { Title, Text } = Typography;

const BRAND = '#6132C0';

/**
 * Category management is atomic on the backend: there are no assign/remove
 * endpoints — the full `categoryIds` set is sent on create/update. The view
 * therefore routes every category change through `onUpdateMenu`.
 */
interface MenuFormValues {
  title: string;
  subtitle?: string;
  isActive: boolean;
  categoryIds: string[];
}

interface MenuManagementViewProps {
  menus: MenuEntity[];
  categories: Category[];
  loading: boolean;
  isFetching?: boolean;
  onRefresh: () => void;
  onCreateMenu: (values: MenuFormValues) => Promise<unknown>;
  onUpdateMenu: (id: string, values: Partial<MenuFormValues> & { isActive: boolean }) => Promise<unknown>;
  onDeleteMenu: (id: string) => Promise<unknown>;
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
}) => {
  const { token } = theme.useToken();

  const [selectedMenu, setSelectedMenu] = useState<MenuEntity | null>(null);
  const [formOpen, setFormOpen]         = useState(false);
  const [editingMenu, setEditingMenu]   = useState<MenuEntity | null>(null);
  const [saving, setSaving]             = useState(false);
  const [savingCats, setSavingCats]     = useState(false);
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [addingId, setAddingId]         = useState<string | null>(null);

  // List controls
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [catSearch, setCatSearch]       = useState('');
  const [availSearch, setAvailSearch]   = useState('');

  const [form] = Form.useForm();

  // Keep selectedMenu in sync when TanStack Query refreshes the list
  useEffect(() => {
    if (selectedMenu) {
      const refreshed = menus.find((m) => m.id === selectedMenu.id);
      setSelectedMenu(refreshed ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus]);

  // Auto-select the first menu once data loads (better default than a blank pane).
  useEffect(() => {
    if (!selectedMenu && !loading && menus.length > 0) setSelectedMenu(menus[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, menus]);

  const currentCategoryIds = useMemo(
    () => (selectedMenu?.categories ?? []).map((c) => c.categoryId),
    [selectedMenu],
  );
  const assignedIds = useMemo(() => new Set(currentCategoryIds), [currentCategoryIds]);
  const unassigned  = useMemo(() => categories.filter((c) => !assignedIds.has(c.id)), [categories, assignedIds]);
  const getCatName  = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getCat      = (id: string) => categories.find((c) => c.id === id);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name, disabled: c.isActive === false })),
    [categories],
  );

  const activeCount = useMemo(() => menus.filter((m) => m.isActive).length, [menus]);

  // Filtered + searched menu list.
  const visibleMenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menus.filter((m) => {
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'inactive' && m.isActive) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.subtitle ?? '').toLowerCase().includes(q)
      );
    });
  }, [menus, search, statusFilter]);

  const visibleDetailCategories = useMemo(() => {
    const list = selectedMenu?.categories ?? [];
    const q = catSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((mc) => (getCat(mc.categoryId)?.name ?? mc.name ?? '').toLowerCase().includes(q));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu, catSearch, categories]);

  // Build a full update payload — the backend `IsActive` defaults to `true`, so
  // we always echo the menu's current state to avoid unintended re-activation.
  const buildUpdate = (menu: MenuEntity, categoryIds: string[]) => ({
    title: menu.title,
    subtitle: menu.subtitle,
    isActive: menu.isActive,
    categoryIds,
  });

  // ── Menu CRUD ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingMenu(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, categoryIds: [] });
    setFormOpen(true);
  };

  const openEdit = (menu: MenuEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingMenu(menu);
    form.setFieldsValue({
      title: menu.title,
      subtitle: menu.subtitle,
      isActive: menu.isActive,
      categoryIds: (menu.categories ?? []).map((c) => c.categoryId),
    });
    setFormOpen(true);
  };

  const handleSaveMenu = async () => {
    const values = (await form.validateFields()) as MenuFormValues;
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

  const handleToggleActive = async (menu: MenuEntity, next: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await onUpdateMenu(menu.id, { ...buildUpdate(menu, currentCategoryIds.length ? currentCategoryIds : (menu.categories ?? []).map(c => c.categoryId)), isActive: next });
      message.success(next ? 'Menu activated' : 'Menu deactivated');
    } catch {
      // axios interceptor already shows a toast
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

  // ── Category assignment (routed through update) ─────────────────────────────────

  // Single source of truth: persist the full category set via update. Handles
  // both add and remove from one control. Updates the UI optimistically so the
  // change shows instantly, then reconciles with the server (rolling back on error).
  const handleSetCategories = async (nextIds: string[]) => {
    if (!selectedMenu) return;
    if (nextIds.length < 1) {
      message.warning('A menu must have at least one category.');
      return;
    }

    const prev = selectedMenu;
    const added = nextIds.find((id) => !currentCategoryIds.includes(id));
    const removed = currentCategoryIds.find((id) => !nextIds.includes(id));
    if (!added && !removed) return; // nothing changed

    // Optimistic: rebuild the menu's category list in the order selected.
    const optimisticCategories = nextIds.map(
      (id) => prev.categories?.find((c) => c.categoryId === id) ?? { categoryId: id, name: getCatName(id) },
    );
    setSelectedMenu({ ...prev, categories: optimisticCategories });

    setSavingCats(true);
    try {
      await onUpdateMenu(prev.id, buildUpdate(prev, nextIds));
      if (added) message.success(`"${getCatName(added)}" added`);
      else if (removed) message.success(`"${getCatName(removed)}" removed`);
    } catch {
      setSelectedMenu(prev); // rollback; axios interceptor already showed a toast
    } finally {
      setSavingCats(false);
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!selectedMenu) return;
    if (currentCategoryIds.length <= 1) {
      message.warning('A menu must have at least one category.');
      return;
    }
    setRemovingId(categoryId);
    await handleSetCategories(currentCategoryIds.filter((id) => id !== categoryId));
    setRemovingId(null);
  };

  // Add a single category by checking it in the "Available" list below.
  const handleAddCategory = async (categoryId: string) => {
    if (!selectedMenu || currentCategoryIds.includes(categoryId)) return;
    setAddingId(categoryId);
    await handleSetCategories([...currentCategoryIds, categoryId]);
    setAddingId(null);
  };

  // Available (unassigned) categories, filtered by the available-list search.
  const visibleAvailable = useMemo(() => {
    const q = availSearch.trim().toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter((c) => c.name.toLowerCase().includes(q));
  }, [unassigned, availSearch]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', gap: 20, overflow: 'hidden' }}>

      {/* ── Left: Menu list ── */}
      <div
        style={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          background: token.colorBgContainer,
          borderRadius: 14,
          border: `1px solid ${token.colorBorderSecondary}`,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Space>
              <div
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `linear-gradient(135deg, ${BRAND}, #8b5cf6)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ReadOutlined style={{ color: '#fff', fontSize: 15 }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, display: 'block', lineHeight: 1.2 }}>Menus</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{activeCount} active · {menus.length} total</Text>
              </div>
            </Space>
            <Space size={4}>
              <Tooltip title="Refresh">
                <Button size="small" icon={<ReloadOutlined spin={isFetching} />} onClick={onRefresh} loading={isFetching} />
              </Tooltip>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>New</Button>
            </Space>
          </div>

          <Input
            allowClear
            size="middle"
            placeholder="Search menus…"
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 10, borderRadius: 8 }}
          />

          <Segmented
            block
            size="small"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { label: `All (${menus.length})`, value: 'all' },
              { label: `Active (${activeCount})`, value: 'active' },
              { label: `Inactive (${menus.length - activeCount})`, value: 'inactive' },
            ]}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {loading ? (
            [1, 2, 3].map((n) => (
              <Skeleton key={n} active paragraph={{ rows: 1 }} style={{ margin: '8px 4px' }} />
            ))
          ) : visibleMenus.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={menus.length === 0 ? 'No menus yet' : 'No menus match your filters'}
              style={{ marginTop: 40 }}
            />
          ) : (
            visibleMenus.map((menu) => {
              const sel = selectedMenu?.id === menu.id;
              const catCount = (menu.categories ?? []).length;
              return (
                <div
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: sel ? token.colorPrimaryBg : token.colorBgContainer,
                    border: `1px solid ${sel ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                    marginBottom: 8,
                    transition: 'all 0.15s',
                    boxShadow: sel ? `0 2px 10px ${token.colorPrimaryBg}` : 'none',
                  }}
                  onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorPrimaryBorderHover; }}
                  onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLDivElement).style.borderColor = token.colorBorderSecondary; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span
                          style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: menu.isActive ? '#52c41a' : token.colorTextQuaternary,
                            boxShadow: menu.isActive ? '0 0 0 3px rgba(82,196,26,0.15)' : 'none',
                          }}
                        />
                        <Text strong ellipsis style={{ fontSize: 14.5, color: sel ? BRAND : token.colorText }}>
                          {menu.title}
                        </Text>
                      </div>
                      {menu.subtitle && (
                        <Text type="secondary" ellipsis style={{ fontSize: 12.5, display: 'block', paddingLeft: 14 }}>
                          {menu.subtitle}
                        </Text>
                      )}
                      <div style={{ marginTop: 8, paddingLeft: 14 }}>
                        <Tag
                          icon={<TagsOutlined />}
                          color={catCount > 0 ? 'purple' : 'default'}
                          style={{ fontSize: 11, borderRadius: 6, margin: 0 }}
                        >
                          {catCount} {catCount === 1 ? 'category' : 'categories'}
                        </Tag>
                      </div>
                    </div>
                    <Space size={0} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                      <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined style={{ color: BRAND }} />} onClick={(e) => openEdit(menu, e)} />
                      </Tooltip>
                      <Popconfirm title="Delete this menu?" description="Category assignments will also be removed." onConfirm={() => handleDeleteMenu(menu.id)} okButtonProps={{ danger: true }}>
                        <Tooltip title="Delete">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
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
        {loading ? (
          <div style={{ flex: 1, padding: 24, background: token.colorBgContainer, borderRadius: 14, border: `1px solid ${token.colorBorderSecondary}` }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : !selectedMenu ? (
          <div
            style={{
              flex: 1, height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: token.colorBgContainer,
              borderRadius: 14,
              border: `1px dashed ${token.colorBorderSecondary}`,
              gap: 12,
            }}
          >
            <FolderOpenOutlined style={{ fontSize: 52, color: token.colorTextQuaternary }} />
            <Text type="secondary">Select a menu on the left to manage its categories</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Create your first menu</Button>
          </div>
        ) : (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: token.colorBgContainer,
              borderRadius: 14,
              border: `1px solid ${token.colorBorderSecondary}`,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Detail header */}
            <div
              style={{
                padding: '20px 24px',
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <Space align="center" style={{ marginBottom: 4 }} wrap>
                    <Title level={3} style={{ margin: 0 }} ellipsis={{ tooltip: selectedMenu.title }}>{selectedMenu.title}</Title>
                    <Tag
                      icon={selectedMenu.isActive ? <CheckCircleFilled /> : <PauseCircleFilled />}
                      color={selectedMenu.isActive ? 'success' : 'default'}
                      style={{ borderRadius: 12, paddingInline: 10 }}
                    >
                      {selectedMenu.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </Space>
                  {selectedMenu.subtitle && (
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>{selectedMenu.subtitle}</Text>
                  )}
                </div>
                <Space>
                  <Tooltip title={selectedMenu.isActive ? 'Set inactive' : 'Set active'}>
                    <Switch
                      checked={selectedMenu.isActive}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                      onChange={(v) => handleToggleActive(selectedMenu, v)}
                    />
                  </Tooltip>
                  <Button icon={<EditOutlined />} onClick={() => openEdit(selectedMenu)}>Edit</Button>
                </Space>
              </div>

              {/* Compact inline summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                <Space size={6}>
                  <TagsOutlined style={{ color: BRAND, fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12.5 }}>
                    <Text strong style={{ color: BRAND }}>{(selectedMenu.categories ?? []).length}</Text> assigned
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12.5 }}>·</Text>
                <Space size={6}>
                  <AppstoreAddOutlined style={{ color: token.colorTextTertiary, fontSize: 13 }} />
                  <Text type="secondary" style={{ fontSize: 12.5 }}>
                    <Text strong>{unassigned.length}</Text> available to add
                  </Text>
                </Space>
              </div>
            </div>

            {/* Assigned list toolbar */}
            <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Assigned
              </Text>
              <div style={{ flex: 1 }} />
              {(selectedMenu.categories ?? []).length > 0 && (
                <Input
                  allowClear
                  size="small"
                  placeholder="Filter categories…"
                  prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  style={{ width: 220, borderRadius: 8 }}
                />
              )}
            </div>

            {/* Category grid */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 24px 16px' }}>
              {(selectedMenu.categories ?? []).length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories assigned yet" />
                  <Text type="secondary" style={{ fontSize: 12 }}>Tick a category in the “Available to add” list below.</Text>
                </div>
              ) : visibleDetailCategories.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories match your filter" style={{ marginTop: 40 }} />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: 12,
                  }}
                >
                  {visibleDetailCategories.map((mc) => {
                    const cat = getCat(mc.categoryId);
                    const name = cat?.name ?? mc.name ?? getCatName(mc.categoryId);
                    return (
                      <div
                        key={mc.categoryId}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          background: token.colorBgContainer,
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = token.colorPrimaryBorder;
                          el.style.boxShadow = `0 4px 14px ${token.colorPrimaryBg}`;
                          el.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = token.colorBorderSecondary;
                          el.style.boxShadow = 'none';
                          el.style.transform = 'none';
                        }}
                      >
                        <Avatar
                          shape="square"
                          size={40}
                          style={{ background: token.colorPrimaryBg, color: BRAND, flexShrink: 0, borderRadius: 10, fontWeight: 700 }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13.5, display: 'block' }} ellipsis={{ tooltip: name }}>
                            {name}
                          </Text>
                          {cat?.description ? (
                            <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 2 }} ellipsis={{ tooltip: cat.description }}>
                              {cat.description}
                            </Text>
                          ) : (
                            <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 2 }}>—</Text>
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
                              type="text" size="small" danger
                              loading={removingId === mc.categoryId}
                              icon={<MinusCircleOutlined style={{ fontSize: 15 }} />}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Available to add: click a card to assign, no dropdown navigation ── */}
            <div
              style={{
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                background: token.colorBgContainer,
                padding: '14px 24px 16px',
                flexShrink: 0,
                maxHeight: '40%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AppstoreAddOutlined style={{ color: token.colorTextSecondary }} />
                <Text strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>Available to add</Text>
                <Tag style={{ fontSize: 11, margin: 0 }}>{unassigned.length}</Tag>
                <div style={{ flex: 1 }} />
                {unassigned.length > 0 && (
                  <Input
                    allowClear
                    size="small"
                    placeholder="Search…"
                    prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                    value={availSearch}
                    onChange={(e) => setAvailSearch(e.target.value)}
                    style={{ width: 200, borderRadius: 8 }}
                  />
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {unassigned.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>All categories are assigned to this menu.</Text>
                  </div>
                ) : visibleAvailable.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>No categories match your search.</Text>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {visibleAvailable.map((cat) => {
                      const disabled = cat.isActive === false || savingCats;
                      const busy = addingId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleAddCategory(cat.id)}
                          style={{
                            textAlign: 'left',
                            font: 'inherit',
                            padding: 14,
                            borderRadius: 12,
                            border: `1px dashed ${token.colorBorder}`,
                            background: token.colorBgContainer,
                            display: 'flex', gap: 12, alignItems: 'center',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled && !busy ? 0.55 : 1,
                            transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (disabled) return;
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = BRAND;
                            el.style.borderStyle = 'solid';
                            el.style.background = token.colorPrimaryBg;
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = token.colorBorder;
                            el.style.borderStyle = 'dashed';
                            el.style.background = token.colorBgContainer;
                          }}
                        >
                          <Avatar
                            shape="square"
                            size={40}
                            style={{ background: token.colorFillSecondary, color: token.colorTextSecondary, flexShrink: 0, borderRadius: 10, fontWeight: 700 }}
                          >
                            {cat.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text strong style={{ fontSize: 13.5, display: 'block' }} ellipsis={{ tooltip: cat.name }}>
                              {cat.name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 2 }} ellipsis={{ tooltip: cat.description || undefined }}>
                              {cat.description || '—'}
                            </Text>
                            {cat.isActive === false && (
                              <Tag color="orange" style={{ marginTop: 6, fontSize: 10 }}>Inactive</Tag>
                            )}
                          </div>
                          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, color: BRAND, fontSize: 12.5, fontWeight: 600 }}>
                            <PlusOutlined spin={busy} style={{ fontSize: 12 }} />
                            Add
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        title={editingMenu ? 'Edit Menu' : 'Create Menu'}
        open={formOpen}
        onOk={handleSaveMenu}
        okText={editingMenu ? 'Save Changes' : 'Create Menu'}
        okButtonProps={{ loading: saving }}
        onCancel={() => setFormOpen(false)}
        width={480}
        destroyOnHidden
      >
        <Form form={form} name="menu_modal_form" layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Menu Title" rules={[{ required: true, message: 'Title is required' }, { max: 100, message: 'Max 100 characters' }]}>
            <Input placeholder="e.g. Breakfast Menu" size="large" showCount maxLength={100} />
          </Form.Item>
          <Form.Item name="subtitle" label="Subtitle (optional)" rules={[{ max: 200, message: 'Max 200 characters' }]}>
            <Input placeholder="e.g. Served 6am – 11am" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="categoryIds"
            label="Categories"
            rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one category' }]}
            extra={categories.length === 0 ? 'No categories exist yet — create categories first.' : 'A menu must contain at least one category.'}
          >
            <Select
              mode="multiple"
              size="large"
              allowClear
              placeholder="Select one or more categories…"
              showSearch
              optionFilterProp="label"
              options={categoryOptions}
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default MenuManagementView;
