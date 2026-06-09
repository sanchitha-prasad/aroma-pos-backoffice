import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge, Button, Divider, Drawer, Empty, Form, Input, InputNumber,
  Popconfirm, Select, Space, Spin, Switch, Table, Tabs, Tag,
  TimePicker, Tooltip, Typography, message, theme,
} from 'antd';
import {
  AppstoreOutlined, CaretDownFilled, CaretRightFilled,
  CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled,
  CloudUploadOutlined, MinusCircleOutlined, PlusCircleOutlined,
  ReadOutlined, SaveOutlined, SearchOutlined, ShopOutlined,
  TagOutlined, UnorderedListOutlined, WarningFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  Branch, BranchCategoryAssignment, BranchItemAssignment,
  BranchItemVariantAssignment, BranchMenuAssignment,
  BranchModifierAssignment, BranchModifierGroupAssignment,
  ServiceAvailability,
} from '../../../shared/types';
import { BranchCatalogService, BulkSavePayload, parseAvailabilities } from '../api/branch-catalog.service';
import { useCurrency } from '../../../shared/context/CurrencyContext';
import { useMenus } from '../../catalog/hooks/useMenus';

const { Text, Title } = Typography;

// ─── Domain node types ────────────────────────────────────────────────────────

type NodeType = 'menu' | 'category' | 'item' | 'modifierGroup' | 'modifier';

interface BranchNode {
  key: string; type: NodeType; id: string; name: string; subtitle?: string;
  isEnabled: boolean; isSoldOut?: boolean; basePrice?: number; branchPrice?: number;
  serviceAvailabilities: ServiceAvailability[];
  variants: BranchItemVariantAssignment[];
  children: BranchNode[];
}

interface CatalogEntry { id: string; name: string; subtitle?: string; basePrice?: number }

// ─── Pending changes ──────────────────────────────────────────────────────────

interface PendingChanges {
  // Assignments
  menusToAdd:       string[];
  menusToRemove:    string[];
  categoryAdd:      { menuId: string; categoryId: string }[];
  categoryRemove:   { menuId: string; categoryId: string }[];
  itemsToAdd:       string[];
  itemsToRemove:    string[];
  modGroupsToAdd:   string[];
  modGroupsToRemove: string[];
  modifiersToAdd:   string[];
  modifiersToRemove: string[];
  // Overrides (latest write per entity ID wins)
  menuOverrides:     Record<string, { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }>;
  categoryOverrides: Record<string, { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }>;
  itemOverrides:     Record<string, { isEnabled: boolean; isSoldOut: boolean; serviceAvailabilities: ServiceAvailability[] }>;
  // keyed by itemId — each entry is the variants belonging to that item
  variantOverrides:  Record<string, { itemVariantId: string; isEnabled: boolean; branchPrice?: number }[]>;
  modGroupOverrides: Record<string, { isEnabled: boolean; serviceAvailabilities: ServiceAvailability[] }>;
  modifierOverrides: Record<string, { isEnabled: boolean; branchPrice?: number; serviceAvailabilities: ServiceAvailability[] }>;
}

const EMPTY_PENDING: PendingChanges = {
  menusToAdd: [], menusToRemove: [],
  categoryAdd: [], categoryRemove: [],
  itemsToAdd: [], itemsToRemove: [],
  modGroupsToAdd: [], modGroupsToRemove: [],
  modifiersToAdd: [], modifiersToRemove: [],
  menuOverrides: {}, categoryOverrides: {}, itemOverrides: {},
  variantOverrides: {}, modGroupOverrides: {}, modifierOverrides: {},
};

const countPending = (p: PendingChanges): number =>
  p.menusToAdd.length + p.menusToRemove.length +
  p.categoryAdd.length + p.categoryRemove.length +
  p.itemsToAdd.length + p.itemsToRemove.length +
  p.modGroupsToAdd.length + p.modGroupsToRemove.length +
  p.modifiersToAdd.length + p.modifiersToRemove.length +
  Object.keys(p.menuOverrides).length + Object.keys(p.categoryOverrides).length +
  Object.keys(p.itemOverrides).length + Object.values(p.variantOverrides).reduce((s, vs) => s + vs.length, 0) +
  Object.keys(p.modGroupOverrides).length + Object.keys(p.modifierOverrides).length;

// Idempotent: adding then removing the same entity cancels out
const applyAssign = (list: string[], id: string, removals: string[]): [string[], string[]] =>
  [[...list.filter(x => x !== id), id], removals.filter(x => x !== id)];

const applyUnassign = (list: string[], id: string, additions: string[]): [string[], string[]] =>
  [[...list.filter(x => x !== id), id], additions.filter(x => x !== id)];

// Build the bulk save payload from pending state
const buildPayload = (p: PendingChanges): BulkSavePayload => {
  const catByMenu: Record<string, { toAdd: string[]; toRemove: string[] }> = {};
  p.categoryAdd.forEach(({ menuId, categoryId }) => {
    catByMenu[menuId] ??= { toAdd: [], toRemove: [] };
    catByMenu[menuId].toAdd.push(categoryId);
  });
  p.categoryRemove.forEach(({ menuId, categoryId }) => {
    catByMenu[menuId] ??= { toAdd: [], toRemove: [] };
    catByMenu[menuId].toRemove.push(categoryId);
  });

  const orNull = <T,>(arr: T[]) => (arr.length > 0 ? arr : undefined);

  return {
    menusToAdd:    orNull(p.menusToAdd),
    menusToRemove: orNull(p.menusToRemove),
    menuOverrides: Object.keys(p.menuOverrides).length > 0
      ? Object.entries(p.menuOverrides).map(([menuId, o]) => ({ menuId, ...o }))
      : undefined,
    categoryAssignments: Object.keys(catByMenu).length > 0
      ? Object.entries(catByMenu).map(([menuId, v]) => ({ menuId, ...v }))
      : undefined,
    categoryOverrides: Object.keys(p.categoryOverrides).length > 0
      ? Object.entries(p.categoryOverrides).map(([categoryId, o]) => ({ categoryId, ...o }))
      : undefined,
    itemsToAdd:    orNull(p.itemsToAdd),
    itemsToRemove: orNull(p.itemsToRemove),
    itemOverrides: Object.keys(p.itemOverrides).length > 0
      ? Object.entries(p.itemOverrides).map(([itemId, o]) => ({
          itemId, ...o,
          variants: p.variantOverrides[itemId]?.map(v => ({
            itemVariantId: v.itemVariantId, isEnabled: v.isEnabled, price: v.branchPrice,
          })),
        }))
      : undefined,
    modifierGroupsToAdd:    orNull(p.modGroupsToAdd),
    modifierGroupsToRemove: orNull(p.modGroupsToRemove),
    modifierGroupOverrides: Object.keys(p.modGroupOverrides).length > 0
      ? Object.entries(p.modGroupOverrides).map(([modifierGroupId, o]) => ({ modifierGroupId, ...o }))
      : undefined,
    modifiersToAdd:    orNull(p.modifiersToAdd),
    modifiersToRemove: orNull(p.modifiersToRemove),
    modifierOverrides: Object.keys(p.modifierOverrides).length > 0
      ? Object.entries(p.modifierOverrides).map(([modifierId, o]) => ({ modifierId, ...o }))
      : undefined,
  };
};

// ─── Response-to-node mapping helpers ────────────────────────────────────────

const menuToNode = (m: BranchMenuAssignment): BranchNode =>
  mk('menu', m.menuId, m.title, m.isEnabled, {
    subtitle: m.subtitle,
    serviceAvailabilities: parseAvailabilities(m.serviceAvailabilities as any),
  });

const categoryToNode = (c: BranchCategoryAssignment): BranchNode =>
  mk('category', c.categoryId, c.name, c.isEnabled, {
    subtitle: c.description,
    serviceAvailabilities: parseAvailabilities(c.serviceAvailabilities as any),
  });

const itemToNode = (i: BranchItemAssignment): BranchNode =>
  mk('item', i.itemId, i.name, i.isEnabled, {
    subtitle: i.description,
    isSoldOut: i.isSoldOut,
    serviceAvailabilities: parseAvailabilities(i.serviceAvailabilities as any),
    variants: i.variants,
  });

const modGroupToNode = (mg: BranchModifierGroupAssignment): BranchNode =>
  mk('modifierGroup', mg.modifierGroupId, mg.name, mg.isEnabled, {
    subtitle: `Min ${mg.minSelectCount} / Max ${mg.maxSelectCount}`,
    serviceAvailabilities: parseAvailabilities(mg.serviceAvailabilities as any),
  });

const modifierToNode = (m: BranchModifierAssignment): BranchNode =>
  mk('modifier', m.modifierId, m.name, m.isEnabled, {
    basePrice: m.basePrice,
    branchPrice: m.branchPrice,
    serviceAvailabilities: parseAvailabilities(m.serviceAvailabilities as any),
  });

// ─── Node meta ────────────────────────────────────────────────────────────────

const NODE_META: Record<NodeType, {
  icon: React.ReactNode; color: string; bg: string;
  childType: NodeType | null; childLabel: string; childPlural: string;
}> = {
  menu:          { icon: <ReadOutlined />,          color: '#6132C0', bg: '#f5f0ff', childType: 'category',     childLabel: 'Category',       childPlural: 'categories'      },
  category:      { icon: <AppstoreOutlined />,      color: '#1677ff', bg: '#e6f4ff', childType: 'item',          childLabel: 'Item',           childPlural: 'items'           },
  item:          { icon: <UnorderedListOutlined />, color: '#389e0d', bg: '#f6ffed', childType: 'modifierGroup', childLabel: 'Modifier Group', childPlural: 'modifier groups' },
  modifierGroup: { icon: <TagOutlined />,           color: '#d46b08', bg: '#fff7e6', childType: 'modifier',      childLabel: 'Modifier',       childPlural: 'modifiers'       },
  modifier:      { icon: <TagOutlined />,           color: '#c41d7f', bg: '#fff0f6', childType: null,             childLabel: '',               childPlural: ''                },
};

// ─── Tree operations ──────────────────────────────────────────────────────────

const mk = (type: NodeType, id: string, name: string, enabled: boolean, extra: Partial<BranchNode> = {}): BranchNode => ({
  key: `${type}::${id}`, type, id, name, isEnabled: enabled,
  serviceAvailabilities: extra.serviceAvailabilities ?? [],
  variants: extra.variants ?? [], children: extra.children ?? [], ...extra,
});

const updateNode = (nodes: BranchNode[], key: string, patch: Partial<BranchNode>): BranchNode[] =>
  nodes.map(n => n.key === key ? { ...n, ...patch } : { ...n, children: updateNode(n.children, key, patch) });

const removeNode = (nodes: BranchNode[], key: string): BranchNode[] =>
  nodes.filter(n => n.key !== key).map(n => ({ ...n, children: removeNode(n.children, key) }));

const addChild = (nodes: BranchNode[], parentKey: string, child: BranchNode): BranchNode[] =>
  nodes.map(n => n.key === parentKey ? { ...n, children: [...n.children, child] } : { ...n, children: addChild(n.children, parentKey, child) });

const findNode = (nodes: BranchNode[], key: string): BranchNode | null => {
  for (const n of nodes) {
    if (n.key === key) return n;
    const f = findNode(n.children, key);
    if (f) return f;
  }
  return null;
};

const walkCount = (nodes: BranchNode[], type: NodeType): number =>
  nodes.reduce((a, n) => a + (n.type === type ? 1 : 0) + walkCount(n.children, type), 0);

// ─── Days ─────────────────────────────────────────────────────────────────────

const DAYS = [
  { short: 'Sun', value: 0 }, { short: 'Mon', value: 1 }, { short: 'Tue', value: 2 },
  { short: 'Wed', value: 3 }, { short: 'Thu', value: 4 }, { short: 'Fri', value: 5 },
  { short: 'Sat', value: 6 },
];

// ─── Availability Editor ──────────────────────────────────────────────────────

const AvailabilityEditor: React.FC<{ value: ServiceAvailability[]; onChange: (v: ServiceAvailability[]) => void }> = ({ value, onChange }) => {
  const { token } = theme.useToken();
  const get = (d: number) => value.find(a => a.dayOfWeek === d);
  const toggle = (d: number, on: boolean) =>
    on ? onChange([...value, { dayOfWeek: d, startTime: '09:00', endTime: '22:00' }])
       : onChange(value.filter(a => a.dayOfWeek !== d));
  const setT = (d: number, s: string, e: string) =>
    onChange(value.map(a => a.dayOfWeek === d ? { ...a, startTime: s, endTime: e } : a));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {DAYS.map(({ short, value: d }) => {
        const entry = get(d); const on = !!entry;
        return (
          <div key={d} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            borderRadius: 8, minHeight: 44,
            background: on ? token.colorPrimaryBg : token.colorFillQuaternary,
            border: `1px solid ${on ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
          }}>
            <Switch checked={on} onChange={v => toggle(d, v)} />
            <Text style={{ width: 36, fontSize: 14, fontWeight: on ? 600 : 400 }}>{short}</Text>
            {on
              ? <TimePicker.RangePicker format="HH:mm" style={{ flex: 1 }}
                  value={[dayjs(entry!.startTime, 'HH:mm'), dayjs(entry!.endTime, 'HH:mm')]}
                  onChange={t => { if (t?.[0] && t?.[1]) setT(d, t[0].format('HH:mm'), t[1].format('HH:mm')); }}
                />
              : <Text type="secondary" style={{ fontSize: 13 }}>Closed</Text>
            }
          </div>
        );
      })}
    </div>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ icon?: React.ReactNode; label: string; count?: number; color?: string }> = ({ icon, label, count, color }) => {
  const { token } = theme.useToken();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {icon && <span style={{ color: color ?? token.colorPrimary, fontSize: 15 }}>{icon}</span>}
      <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: token.colorTextSecondary }}>{label}</Text>
      {count !== undefined && (
        <div style={{ height: 20, minWidth: 20, padding: '0 6px', borderRadius: 10, background: token.colorFillSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>{count}</Text>
        </div>
      )}
      <div style={{ flex: 1, height: 1, background: token.colorBorderSecondary }} />
    </div>
  );
};

// ─── Detail panel — content (only rendered when a node is selected) ───────────
// Keeping Form.useForm() here ensures it is always connected to a <Form> element.

const DetailPanelContent: React.FC<{
  node: BranchNode;
  onApply: (key: string, patch: Partial<BranchNode>) => void;
}> = ({ node, onApply }) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [avail, setAvail] = useState<ServiceAvailability[]>([]);
  const [search, setSearch] = useState('');
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue({ isEnabled: node.isEnabled, isSoldOut: node.isSoldOut ?? false, branchPrice: node.branchPrice ?? null });
    (node.variants ?? []).forEach(v => {
      form.setFieldValue(`ve_${v.itemVariantId}`, v.isEnabled);
      form.setFieldValue(`vp_${v.itemVariantId}`, v.branchPrice ?? null);
    });
    setAvail(node.serviceAvailabilities ?? []);
    setSearch('');
  }, [node.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta    = NODE_META[node.type];
  const isItem  = node.type === 'item';
  const isMod   = node.type === 'modifier';
  const hasKids = node.type !== 'modifier';

  const handleApply = async () => {
    const vals = await form.validateFields();
    const variants = (node.variants ?? []).map(v => ({
      ...v, isEnabled: vals[`ve_${v.itemVariantId}`] ?? v.isEnabled,
      branchPrice: vals[`vp_${v.itemVariantId}`] ?? v.branchPrice,
    }));
    onApply(node.key, {
      isEnabled: vals.isEnabled, isSoldOut: vals.isSoldOut,
      branchPrice: vals.branchPrice ?? undefined,
      serviceAvailabilities: avail, variants,
    });
  };

  // ── Children tab ──────────────────────────────────────────────────────────
  const filteredAssigned = node.children.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const childrenTab = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px 12px' }}>
        <Input size="large" prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          placeholder={`Search ${meta.childPlural}…`} value={search} onChange={e => setSearch(e.target.value)} allowClear />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px' }}>
        <SectionLabel icon={<CheckCircleFilled />} label="Assigned to this branch" count={node.children.length} color="#389e0d" />
        {filteredAssigned.length === 0 ? (
          <div style={{ padding: '32px 24px', borderRadius: 12, textAlign: 'center', border: `2px dashed ${token.colorBorderSecondary}`, background: token.colorFillQuaternary, marginBottom: 28 }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {node.children.length === 0 ? `No ${meta.childPlural} assigned yet` : 'No matches'}
            </Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {filteredAssigned.map(child => {
              const cm = NODE_META[child.type];
              return (
                <div key={child.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 12, border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  borderLeft: `3px solid ${cm.color}`,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: cm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: cm.color, fontSize: 16 }}>{cm.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 14, display: 'block' }}>{child.name}</Text>
                    {child.subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{child.subtitle}</Text>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {child.isEnabled ? <Tag color="success" style={{ fontSize: 12 }}>Enabled</Tag> : <Tag style={{ fontSize: 12 }}>Disabled</Tag>}
                    {child.isSoldOut && <Tag color="warning" style={{ fontSize: 12 }}>Sold Out</Tag>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Overrides tab ─────────────────────────────────────────────────────────
  const overridesTab = (
    <div style={{ overflowY: 'auto', padding: '20px 24px 40px' }}>
      <Form form={form} name="branch_catalog_form" layout="vertical">
        <SectionLabel label="Status" />
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Enabled at branch</Text>
            <Form.Item name="isEnabled" valuePropName="checked" style={{ margin: 0 }}>
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </div>
          {isItem && (
            <div style={{ flex: 1, background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px' }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sold out</Text>
              <Form.Item name="isSoldOut" valuePropName="checked" style={{ margin: 0 }}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </div>
          )}
        </div>

        {isMod && (
          <>
            <SectionLabel label="Price Override" />
            <div style={{ background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Global base price</Text>
                  <div style={{ padding: '6px 16px', borderRadius: 8, background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}` }}>
                    <Text strong style={{ fontSize: 16, fontFamily: 'monospace' }}>{currencySymbol}{node.basePrice?.toFixed(2)}</Text>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 20 }}>→</Text>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Branch override price</Text>
                  <Form.Item name="branchPrice" style={{ margin: 0 }}>
                    <InputNumber prefix={currencySymbol} precision={2} min={0} placeholder="Enter branch price…" size="large" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </div>
            </div>
          </>
        )}

        {isItem && (node.variants ?? []).length > 0 && (
          <>
            <SectionLabel label="Variants" count={node.variants.length} />
            <div style={{ background: token.colorFillQuaternary, borderRadius: 10, padding: '4px', marginBottom: 24 }}>
              <Table size="middle" dataSource={node.variants} rowKey="itemVariantId" pagination={false}
                columns={[
                  { title: 'Variant', dataIndex: 'variantName', render: (t: string) => <Text style={{ fontSize: 14 }}>{t}</Text> },
                  { title: `Base (${currencySymbol})`, dataIndex: 'basePrice', width: 100, render: (p: number) => <Text style={{ fontSize: 14, fontFamily: 'monospace' }}>{currencySymbol}{p?.toFixed(2)}</Text> },
                  { title: `Branch (${currencySymbol})`, width: 160, render: (_: any, r: any) => (
                    <Form.Item name={`vp_${r.itemVariantId}`} style={{ margin: 0 }} initialValue={r.branchPrice ?? null}>
                      <InputNumber prefix={currencySymbol} precision={2} min={0} placeholder="Override" style={{ width: '100%' }} />
                    </Form.Item>
                  )},
                  { title: 'Enabled', width: 80, render: (_: any, r: any) => (
                    <Form.Item name={`ve_${r.itemVariantId}`} valuePropName="checked" style={{ margin: 0 }} initialValue={r.isEnabled}>
                      <Switch />
                    </Form.Item>
                  )},
                ]}
              />
            </div>
          </>
        )}

        <SectionLabel icon={<ClockCircleOutlined />} label="Weekly Availability" count={avail.length} />
        <div style={{ marginBottom: 28 }}>
          <AvailabilityEditor value={avail} onChange={setAvail} />
        </div>

        <Button type="primary" icon={<SaveOutlined />} block size="large" onClick={handleApply}
          style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10 }}>
          Apply Override
        </Button>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          Changes are queued — click <strong>Save All</strong> in the header to commit
        </Text>
      </Form>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '20px 24px 16px',
        background: `linear-gradient(135deg, ${meta.bg} 0%, ${token.colorBgContainer} 60%)`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.bg, border: `1.5px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
          </div>
          <Tag style={{ fontSize: 12, fontWeight: 600, color: meta.color, borderColor: meta.color + '50', background: meta.bg }}>
            {node.type === 'modifierGroup' ? 'Modifier Group' : node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </Tag>
          {node.isEnabled ? <Tag icon={<CheckCircleFilled />} color="success" style={{ fontSize: 12 }}>Enabled</Tag> : <Tag icon={<CloseCircleFilled />} color="default" style={{ fontSize: 12 }}>Disabled</Tag>}
          {node.isSoldOut && <Tag color="warning" icon={<WarningFilled />} style={{ fontSize: 12 }}>Sold Out</Tag>}
          {node.branchPrice != null && node.branchPrice !== node.basePrice && <Tag color="orange" style={{ fontSize: 12 }}>Price Override</Tag>}
        </div>
        <Title level={4} style={{ margin: 0, fontSize: 20 }}>{node.name}</Title>
        {node.subtitle && <Text type="secondary" style={{ fontSize: 14, marginTop: 2, display: 'block' }}>{node.subtitle}</Text>}
      </div>

      <Tabs defaultActiveKey={hasKids ? 'children' : 'overrides'}
        style={{ flex: 1, overflow: 'hidden' }}
        tabBarStyle={{ margin: 0, padding: '0 24px', background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}`, fontSize: 14 }}
        size="large"
        items={[
          ...(hasKids ? [{
            key: 'children',
            label: <Space size={6}><span>Manage {meta.childLabel}s</span><div style={{ height: 20, minWidth: 20, padding: '0 6px', borderRadius: 10, background: token.colorPrimaryBg, color: token.colorPrimary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{node.children.length}</div></Space>,
            children: <div style={{ height: 'calc(100vh - 310px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{childrenTab}</div>,
          }] : []),
          {
            key: 'overrides',
            label: 'Branch Overrides',
            children: <div style={{ height: 'calc(100vh - 310px)', overflowY: 'auto' }}>{overridesTab}</div>,
          },
        ]}
      />
    </div>
  );
};

// ─── Detail panel — shell (handles null node) ─────────────────────────────────

const DetailPanel: React.FC<{
  node: BranchNode | null;
  onApply: (key: string, patch: Partial<BranchNode>) => void;
}> = ({ node, onApply }) => {
  const { token } = theme.useToken();

  if (!node) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48, opacity: 0.5 }}>
      <ReadOutlined style={{ fontSize: 48, color: token.colorTextQuaternary }} />
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 600, display: 'block', color: token.colorTextSecondary }}>Nothing selected</Text>
        <Text type="secondary" style={{ fontSize: 14 }}>Click any item in the tree to configure its branch settings</Text>
      </div>
    </div>
  );

  // Use node.key so the inner component fully remounts when selection changes,
  // which resets the form and avail state cleanly without manual imperative calls.
  return <DetailPanelContent key={node.key} node={node} onApply={onApply} />;
};

// ─── Tree row ─────────────────────────────────────────────────────────────────

const TreeRow: React.FC<{
  node: BranchNode; depth: number; isSelected: boolean; isExpanded: boolean;
  isDirty: boolean;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void;
  onToggle: (key: string, v: boolean) => void;
  onRemove: (node: BranchNode) => void;
}> = ({ node, depth, isSelected, isExpanded, isDirty, onSelect, onExpand, onToggle, onRemove }) => {
  const { token } = theme.useToken();
  const meta = NODE_META[node.type];
  const hasKids = node.type !== 'modifier';

  return (
    <div onClick={() => onSelect(node)} style={{
      display: 'flex', alignItems: 'center', gap: 0,
      paddingLeft: 8, paddingRight: 14, paddingTop: 6, paddingBottom: 6,
      cursor: 'pointer', borderRadius: 8, minHeight: 44,
      background: isSelected ? `linear-gradient(90deg, ${meta.bg} 0%, ${token.colorBgContainer} 100%)` : 'transparent',
      borderLeft: isSelected ? `3px solid ${meta.color}` : '3px solid transparent',
      marginBottom: 2, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = token.colorFillTertiary; (e.currentTarget as HTMLElement).style.borderLeftColor = meta.color + '40'; } }}
      onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; } }}
    >
      <span onClick={e => { e.stopPropagation(); if (hasKids) onExpand(node.key); }} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: token.colorTextTertiary, fontSize: 10, cursor: hasKids ? 'pointer' : 'default', borderRadius: 4 }}>
        {hasKids ? (isExpanded ? <CaretDownFilled /> : <CaretRightFilled />) : null}
      </span>

      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginRight: 10, background: isSelected ? meta.bg : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: node.isEnabled ? meta.color : token.colorTextQuaternary, fontSize: 14 }}>{meta.icon}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Text ellipsis style={{
          fontSize: depth === 0 ? 15 : depth === 1 ? 14 : 13,
          fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400, display: 'block',
          color: !node.isEnabled ? token.colorTextQuaternary : isSelected ? meta.color : token.colorText,
        }}>{node.name}</Text>
        {node.subtitle && depth < 3 && <Text type="secondary" style={{ fontSize: 12 }}>{node.subtitle}</Text>}
      </div>

      {/* Dirty indicator */}
      {isDirty && <Tooltip title="Unsaved change"><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fa8c16', flexShrink: 0, marginRight: 6 }} /></Tooltip>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginRight: 8 }}>
        {node.isSoldOut && <WarningFilled style={{ color: '#fa8c16', fontSize: 12 }} />}
        {node.type === 'modifier' && node.branchPrice != null && node.branchPrice !== node.basePrice && <Tag color="orange" style={{ fontSize: 10, padding: '0 5px', margin: 0 }}>✎</Tag>}
        {!node.isEnabled ? <CloseCircleFilled style={{ color: token.colorTextQuaternary, fontSize: 12 }} /> : <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />}
      </div>

      <Switch size="small" checked={node.isEnabled}
        onChange={(v, e) => { e.stopPropagation(); onToggle(node.key, v); }}
        onClick={(_, e) => e.stopPropagation()} />

      {depth > 0 && (
        <Popconfirm title={`Remove "${node.name}" from branch?`} description="Queued as a pending removal — saved with Save All." onConfirm={e => { e?.stopPropagation(); onRemove(node); }} okText="Remove" okButtonProps={{ danger: true }}>
          <Tooltip title="Queue removal">
            <Button type="text" size="small" danger icon={<MinusCircleOutlined style={{ fontSize: 13 }} />} onClick={e => e.stopPropagation()} style={{ marginLeft: 4, opacity: 0.6 }} />
          </Tooltip>
        </Popconfirm>
      )}
    </div>
  );
};

// ─── Recursive tree ───────────────────────────────────────────────────────────

const RenderTree: React.FC<{
  nodes: BranchNode[]; depth: number;
  expandedKeys: Set<string>; selectedKey: string | null;
  dirtyKeys: Set<string>; loadingKeys: Set<string>;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void;
  onToggle: (key: string, v: boolean) => void; onRemove: (n: BranchNode) => void;
}> = ({ nodes, depth, expandedKeys, selectedKey, dirtyKeys, loadingKeys, onSelect, onExpand, onToggle, onRemove }) => {
  const { token } = theme.useToken();
  return (
    <>
      {nodes.map(node => {
        const meta = NODE_META[node.type];
        const isLoading = loadingKeys.has(node.key);
        return (
          <React.Fragment key={node.key}>
            <TreeRow node={node} depth={depth}
              isSelected={selectedKey === node.key} isExpanded={expandedKeys.has(node.key)}
              isDirty={dirtyKeys.has(node.key)}
              onSelect={onSelect} onExpand={onExpand} onToggle={onToggle} onRemove={onRemove}
            />
            {expandedKeys.has(node.key) && (
              <div style={{ marginLeft: 20, borderLeft: `2px solid ${meta.color}20`, paddingLeft: 4 }}>
                {isLoading ? (
                  <div style={{ padding: '6px 12px' }}><Spin size="small" /></div>
                ) : node.children.length > 0 ? (
                  <RenderTree nodes={node.children} depth={depth + 1}
                    expandedKeys={expandedKeys} selectedKey={selectedKey} dirtyKeys={dirtyKeys}
                    loadingKeys={loadingKeys}
                    onSelect={onSelect} onExpand={onExpand} onToggle={onToggle} onRemove={onRemove}
                  />
                ) : node.type !== 'modifier' ? (
                  <div style={{ padding: '6px 12px' }}>
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>No {NODE_META[node.type].childPlural} assigned</Text>
                  </div>
                ) : null}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface BranchCatalogViewProps { branch: Branch; open: boolean; onClose: () => void }

const BranchCatalogView: React.FC<BranchCatalogViewProps> = ({ branch, open, onClose }) => {
  const { token } = theme.useToken();

  const [tree, setTree]                 = useState<BranchNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey]   = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<BranchNode | null>(null);
  const [treeSearch, setTreeSearch]     = useState('');
  const [addMenuOpen, setAddMenuOpen]   = useState(false);
  const [addMenuId, setAddMenuId]       = useState<string | undefined>(undefined);

  // ── Loading states ────────────────────────────────────────────────────────
  const [treeLoading, setTreeLoading]   = useState(false);
  const [loadingKeys, setLoadingKeys]   = useState<Set<string>>(new Set());

  // Refs for loaded/loading sets so loadChildren never has stale closure issues
  const loadedKeysRef  = useRef<Set<string>>(new Set());
  const loadingKeysRef = useRef<Set<string>>(new Set());

  // ── Available menus for the "Add menu" dropdown ───────────────────────────
  const { data: menusData } = useMenus();
  const allMenus: CatalogEntry[] = useMemo(
    () => (menusData || []).map((m) => ({ id: m.id, name: m.title, subtitle: m.subtitle })),
    [menusData],
  );

  // ── Pending changes state ─────────────────────────────────────────────────
  const [pending, setPending] = useState<PendingChanges>(EMPTY_PENDING);
  const [saving, setSaving]   = useState(false);

  const pendingCount = useMemo(() => countPending(pending), [pending]);

  // Track dirty node keys (for orange dot in tree)
  const dirtyKeys = useMemo(() => {
    const keys = new Set<string>();
    [...Object.keys(pending.menuOverrides)].forEach(id => keys.add(`menu::${id}`));
    [...Object.keys(pending.categoryOverrides)].forEach(id => keys.add(`category::${id}`));
    [...Object.keys(pending.itemOverrides)].forEach(id => keys.add(`item::${id}`));
    [...Object.keys(pending.modGroupOverrides)].forEach(id => keys.add(`modifierGroup::${id}`));
    [...Object.keys(pending.modifierOverrides)].forEach(id => keys.add(`modifier::${id}`));
    return keys;
  }, [pending]);

  // ── Init — load menus from API on open ───────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setTree([]);
    setExpandedKeys(new Set());
    setSelectedKey(null); setSelectedNode(null);
    setTreeSearch(''); setPending(EMPTY_PENDING);
    loadedKeysRef.current  = new Set();
    loadingKeysRef.current = new Set();
    setLoadingKeys(new Set());

    setTreeLoading(true);
    BranchCatalogService.getMenus(branch.id)
      .then(res => {
        if (res.success && res.data) {
          setTree(res.data.map(menuToNode));
          // No auto-expand: user expands manually to trigger lazy child loading
        }
      })
      .finally(() => setTreeLoading(false));

  }, [open, branch.id]);

  useEffect(() => {
    if (!selectedKey) return;
    setSelectedNode(findNode(tree, selectedKey));
  }, [tree, selectedKey]);

  // ── Tree actions ──────────────────────────────────────────────────────────

  const loadChildren = useCallback(async (node: BranchNode) => {
    // Use refs so we never read stale state — no closure issues
    if (loadedKeysRef.current.has(node.key) || loadingKeysRef.current.has(node.key)) return;

    loadingKeysRef.current.add(node.key);
    setLoadingKeys(prev => new Set([...prev, node.key]));

    try {
      let children: BranchNode[] = [];

      if (node.type === 'menu') {
        const res = await BranchCatalogService.getCategories(branch.id, node.id);
        if (res.success && res.data) children = res.data.map(categoryToNode);
      } else if (node.type === 'category') {
        const res = await BranchCatalogService.getItems(branch.id, node.id);
        if (res.success && res.data) children = res.data.map(itemToNode);
      } else if (node.type === 'item') {
        const res = await BranchCatalogService.getModifierGroups(branch.id, node.id);
        if (res.success && res.data) children = res.data.map(modGroupToNode);
      } else if (node.type === 'modifierGroup') {
        const res = await BranchCatalogService.getModifiers(branch.id, node.id);
        if (res.success && res.data) children = res.data.map(modifierToNode);
      }

      setTree(t => updateNode(t, node.key, { children }));
      loadedKeysRef.current.add(node.key);
    } catch {
      message.error(`Failed to load ${NODE_META[node.type].childPlural}`);
    } finally {
      loadingKeysRef.current.delete(node.key);
      setLoadingKeys(prev => { const n = new Set(prev); n.delete(node.key); return n; });
    }
  }, [branch.id]);

  const handleExpand = (key: string) => {
    setExpandedKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    const node = findNode(tree, key);
    if (node && node.type !== 'modifier') loadChildren(node);
  };

  const handleSelect = (node: BranchNode) => { setSelectedKey(node.key); setSelectedNode(node); };

  const handleToggle = (key: string, v: boolean) => {
    setTree(t => updateNode(t, key, { isEnabled: v }));
    const node = findNode(tree, key);
    if (!node) return;

    // Record override in pending (latest write wins)
    setPending(p => {
      const avail = node.serviceAvailabilities ?? [];
      switch (node.type) {
        case 'menu':
          return { ...p, menuOverrides: { ...p.menuOverrides, [node.id]: { isEnabled: v, serviceAvailabilities: avail } } };
        case 'category':
          return { ...p, categoryOverrides: { ...p.categoryOverrides, [node.id]: { isEnabled: v, serviceAvailabilities: avail } } };
        case 'item':
          return { ...p, itemOverrides: { ...p.itemOverrides, [node.id]: { isEnabled: v, isSoldOut: node.isSoldOut ?? false, serviceAvailabilities: avail } } };
        case 'modifierGroup':
          return { ...p, modGroupOverrides: { ...p.modGroupOverrides, [node.id]: { isEnabled: v, serviceAvailabilities: avail } } };
        case 'modifier':
          return { ...p, modifierOverrides: { ...p.modifierOverrides, [node.id]: { isEnabled: v, branchPrice: node.branchPrice, serviceAvailabilities: avail } } };
        default: return p;
      }
    });
  };

  // Right panel "Apply Override" — updates tree + records full override in pending
  const handleApplyOverride = (key: string, patch: Partial<BranchNode>) => {
    setTree(t => updateNode(t, key, patch));
    const node = findNode(tree, key);
    if (!node) return;
    const merged = { ...node, ...patch };

    setPending(p => {
      switch (merged.type) {
        case 'menu':
          return { ...p, menuOverrides: { ...p.menuOverrides, [merged.id]: { isEnabled: merged.isEnabled, serviceAvailabilities: merged.serviceAvailabilities } } };
        case 'category':
          return { ...p, categoryOverrides: { ...p.categoryOverrides, [merged.id]: { isEnabled: merged.isEnabled, serviceAvailabilities: merged.serviceAvailabilities } } };
        case 'item': {
          const variants = (merged.variants ?? []).map(v => ({
            itemVariantId: v.itemVariantId, isEnabled: v.isEnabled, branchPrice: v.branchPrice,
          }));
          return {
            ...p,
            itemOverrides: { ...p.itemOverrides, [merged.id]: { isEnabled: merged.isEnabled, isSoldOut: merged.isSoldOut ?? false, serviceAvailabilities: merged.serviceAvailabilities } },
            variantOverrides: { ...p.variantOverrides, [merged.id]: variants },
          };
        }
        case 'modifierGroup':
          return { ...p, modGroupOverrides: { ...p.modGroupOverrides, [merged.id]: { isEnabled: merged.isEnabled, serviceAvailabilities: merged.serviceAvailabilities } } };
        case 'modifier':
          return { ...p, modifierOverrides: { ...p.modifierOverrides, [merged.id]: { isEnabled: merged.isEnabled, branchPrice: merged.branchPrice, serviceAvailabilities: merged.serviceAvailabilities } } };
        default: return p;
      }
    });

    message.success({ content: 'Override queued — click Save All to commit', duration: 2 });
  };

  const handleAddChild = (parentKey: string, entry: CatalogEntry) => {
    const parent = findNode(tree, parentKey);
    if (!parent) return;
    const childType = NODE_META[parent.type].childType!;
    const child = mk(childType, entry.id, entry.name, true, { subtitle: entry.subtitle, basePrice: entry.basePrice });
    setTree(t => addChild(t, parentKey, child));
    setExpandedKeys(prev => new Set([...prev, parentKey]));

    // Record assignment
    setPending(p => {
      switch (childType) {
        case 'category':
          return {
            ...p,
            categoryAdd:    [...p.categoryAdd.filter(c => !(c.menuId === parent.id && c.categoryId === entry.id)), { menuId: parent.id, categoryId: entry.id }],
            categoryRemove: p.categoryRemove.filter(c => !(c.menuId === parent.id && c.categoryId === entry.id)),
          };
        case 'item': {
          const [add, remove] = applyAssign(p.itemsToAdd, entry.id, p.itemsToRemove);
          return { ...p, itemsToAdd: add, itemsToRemove: remove };
        }
        case 'modifierGroup': {
          const [add, remove] = applyAssign(p.modGroupsToAdd, entry.id, p.modGroupsToRemove);
          return { ...p, modGroupsToAdd: add, modGroupsToRemove: remove };
        }
        case 'modifier': {
          const [add, remove] = applyAssign(p.modifiersToAdd, entry.id, p.modifiersToRemove);
          return { ...p, modifiersToAdd: add, modifiersToRemove: remove };
        }
        default: return p;
      }
    });
    message.info({ content: `"${entry.name}" added — queued for save`, duration: 2, icon: <PlusCircleOutlined /> });
  };

  const handleRemoveNode = (node: BranchNode) => {
    // Find parent to determine context
    const findParent = (nodes: BranchNode[], targetKey: string, parent: BranchNode | null = null): BranchNode | null => {
      for (const n of nodes) {
        if (n.children.some(c => c.key === targetKey)) return n;
        const found = findParent(n.children, targetKey, n);
        if (found) return found;
      }
      return parent;
    };
    const parent = findParent(tree, node.key);

    setTree(t => removeNode(t, node.key));
    if (selectedKey === node.key) { setSelectedKey(null); setSelectedNode(null); }

    setPending(p => {
      switch (node.type) {
        case 'menu': {
          const [remove, add] = applyUnassign(p.menusToRemove, node.id, p.menusToAdd);
          return { ...p, menusToRemove: remove, menusToAdd: add };
        }
        case 'category': {
          const menuId = parent?.id ?? '';
          return {
            ...p,
            categoryRemove: [...p.categoryRemove.filter(c => !(c.menuId === menuId && c.categoryId === node.id)), { menuId, categoryId: node.id }],
            categoryAdd:    p.categoryAdd.filter(c => !(c.menuId === menuId && c.categoryId === node.id)),
          };
        }
        case 'item': {
          const [remove, add] = applyUnassign(p.itemsToRemove, node.id, p.itemsToAdd);
          return { ...p, itemsToRemove: remove, itemsToAdd: add };
        }
        case 'modifierGroup': {
          const [remove, add] = applyUnassign(p.modGroupsToRemove, node.id, p.modGroupsToAdd);
          return { ...p, modGroupsToRemove: remove, modGroupsToAdd: add };
        }
        case 'modifier': {
          const [remove, add] = applyUnassign(p.modifiersToRemove, node.id, p.modifiersToAdd);
          return { ...p, modifiersToRemove: remove, modifiersToAdd: add };
        }
        default: return p;
      }
    });
    message.info({ content: `"${node.name}" removal queued`, duration: 2, icon: <MinusCircleOutlined /> });
  };

  const handleAddMenu = () => {
    const entry = allMenus.find(m => m.id === addMenuId);
    if (!entry) return;
    const node = mk('menu', entry.id, entry.name, true, { subtitle: entry.subtitle });
    setTree(t => [...t, node]);
    setExpandedKeys(prev => new Set([...prev, node.key]));
    setAddMenuOpen(false); setAddMenuId(undefined);
    const [add, remove] = applyAssign(pending.menusToAdd, entry.id, pending.menusToRemove);
    setPending(p => ({ ...p, menusToAdd: add, menusToRemove: remove }));
    message.info({ content: `Menu "${entry.name}" queued for assignment`, duration: 2, icon: <PlusCircleOutlined /> });
  };

  // ── Save All ──────────────────────────────────────────────────────────────

  const handleSaveAll = async () => {
    if (pendingCount === 0) return;
    setSaving(true);
    try {
      const payload = buildPayload(pending);
      const res = await BranchCatalogService.saveBulk(branch.id, payload);
      if (res.success) {
        message.success(`✓ ${pendingCount} change${pendingCount !== 1 ? 's' : ''} saved to ${branch.name}`);
        setPending(EMPTY_PENDING);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setTree([]);
    setExpandedKeys(new Set());
    setSelectedKey(null); setSelectedNode(null);
    setPending(EMPTY_PENDING);
    loadedKeysRef.current  = new Set();
    loadingKeysRef.current = new Set();
    setLoadingKeys(new Set());

    setTreeLoading(true);
    BranchCatalogService.getMenus(branch.id)
      .then(res => {
        if (res.success && res.data) setTree(res.data.map(menuToNode));
      })
      .finally(() => setTreeLoading(false));

    message.info('All pending changes discarded');
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const usedMenuIds    = new Set(tree.map(n => n.id));
  const availableMenus = allMenus.filter(m => !usedMenuIds.has(m.id));

  const expandAll = () => {
    const all = new Set<string>();
    const w = (ns: BranchNode[]) => ns.forEach(n => { all.add(n.key); w(n.children); });
    w(tree);
    setExpandedKeys(all);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Drawer
      open={open} onClose={onClose} width="92%"
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { padding: '14px 24px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: `linear-gradient(135deg, #f5f0ff 0%, ${token.colorBgContainer} 50%)` },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6132C0,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShopOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <Text style={{ fontSize: 17, fontWeight: 700, display: 'block', lineHeight: 1.2 }}>Branch Catalog</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>{branch.name}</Text>
          </div>
          {treeLoading && <Spin size="small" style={{ marginLeft: 8 }} />}

          <div style={{ flex: 1 }} />

          {/* Stats */}
          {([
            { label: 'Menus', count: tree.length, color: '#6132C0' },
            { label: 'Cats',  count: walkCount(tree, 'category'),      color: '#1677ff' },
            { label: 'Items', count: walkCount(tree, 'item'),          color: '#389e0d' },
            { label: 'Groups', count: walkCount(tree, 'modifierGroup'), color: '#d46b08' },
            { label: 'Mods',   count: walkCount(tree, 'modifier'),      color: '#c41d7f' },
          ]).map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 12px', borderRadius: 8, background: s.color + '12', border: `1px solid ${s.color}30` }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.count}</Text>
              <Text style={{ fontSize: 10, color: s.color, opacity: 0.8 }}>{s.label}</Text>
            </div>
          ))}

          {/* Pending / Save All */}
          {pendingCount > 0 && (
            <Space size={8} style={{ marginLeft: 8 }}>
              <Badge count={pendingCount} color="#fa8c16" overflowCount={99}>
                <Button type="primary" icon={<CloudUploadOutlined />} loading={saving}
                  onClick={handleSaveAll}
                  style={{ background: '#389e0d', borderColor: '#389e0d', fontWeight: 600, height: 38 }}
                >
                  Save All
                </Button>
              </Badge>
              <Popconfirm title="Discard all pending changes?" onConfirm={handleDiscard} okText="Discard" okButtonProps={{ danger: true }}>
                <Button size="middle" style={{ height: 38 }}>Discard</Button>
              </Popconfirm>
            </Space>
          )}
        </div>
      }
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Tree (55%) ── */}
        <div style={{ width: '55%', flexShrink: 0, borderRight: `1px solid ${token.colorBorderSecondary}`, display: 'flex', flexDirection: 'column', background: token.colorBgContainer }}>

          {/* Unsaved changes ribbon */}
          {pendingCount > 0 && (
            <div style={{ background: '#fffbe6', borderBottom: `1px solid #ffe58f`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <WarningFilled style={{ color: '#fa8c16' }} />
              <Text style={{ fontSize: 13, color: '#d46b08', fontWeight: 500 }}>
                {pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''} — click <strong>Save All</strong> to commit
              </Text>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Input prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="Search the hierarchy…" value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)} allowClear size="large" style={{ flex: 1 }} />
            <Button type="text" size="large" style={{ color: token.colorTextSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}
              onClick={() => expandedKeys.size > 0 ? setExpandedKeys(new Set()) : expandAll()}>
              {expandedKeys.size > 0 ? '⊟ Collapse' : '⊞ Expand'}
            </Button>
            {addMenuOpen ? (
              <Space size={6}>
                <Select size="large" style={{ width: 180 }} placeholder="Select menu…" value={addMenuId} onChange={setAddMenuId}
                  showSearch optionFilterProp="label" options={availableMenus.map(m => ({ value: m.id, label: m.name }))} autoFocus />
                <Button size="large" type="primary" onClick={handleAddMenu} disabled={!addMenuId}>Add</Button>
                <Button size="large" onClick={() => { setAddMenuOpen(false); setAddMenuId(undefined); }}>✕</Button>
              </Space>
            ) : (
              <Button type="dashed" size="large" icon={<PlusCircleOutlined />}
                onClick={() => setAddMenuOpen(true)} disabled={availableMenus.length === 0}
                style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                Add menu
              </Button>
            )}
          </div>

          {/* Level legend */}
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', gap: 20, flexWrap: 'wrap', background: token.colorFillQuaternary }}>
            {(Object.entries(NODE_META) as [NodeType, typeof NODE_META[NodeType]][]).map(([type, m]) => (
              <Space key={type} size={6}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: m.color, fontSize: 12 }}>{m.icon}</span>
                </div>
                <Text style={{ fontSize: 12, fontWeight: 500 }}>{type === 'modifierGroup' ? 'Mod Group' : type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </Space>
            ))}
            <Space size={4}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fa8c16' }} /><Text style={{ fontSize: 12 }}>Unsaved</Text></Space>
          </div>

          {/* Tree */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 24px' }}>
            {treeLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spin size="large" /></div>
            ) : tree.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ fontSize: 14 }}>No menus assigned to this branch</Text>} style={{ marginTop: 80 }}>
                <Button type="primary" size="large" icon={<PlusCircleOutlined />} onClick={() => setAddMenuOpen(true)}>Add First Menu</Button>
              </Empty>
            ) : (
              <RenderTree nodes={tree} depth={0}
                expandedKeys={expandedKeys} selectedKey={selectedKey} dirtyKeys={dirtyKeys}
                loadingKeys={loadingKeys}
                onSelect={handleSelect} onExpand={handleExpand} onToggle={handleToggle} onRemove={handleRemoveNode}
              />
            )}
          </div>
        </div>

        {/* ── Right: Detail panel (45%) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgLayout }}>
          <DetailPanel node={selectedNode} onApply={handleApplyOverride} />
        </div>
      </div>
    </Drawer>
  );
};

export default BranchCatalogView;
