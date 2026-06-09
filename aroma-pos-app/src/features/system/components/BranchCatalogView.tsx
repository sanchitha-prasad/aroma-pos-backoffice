import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Drawer, Empty, Form, Input, InputNumber,
  Popconfirm, Space, Spin, Switch, Table, Tabs, Tag,
  TimePicker, Tooltip, Typography, message, theme,
} from 'antd';
import {
  AppstoreOutlined, CaretDownFilled, CaretRightFilled,
  CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled,
  MinusCircleOutlined, PlusCircleOutlined,
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
import { BranchCatalogService, parseAvailabilities } from '../api/branch-catalog.service';
import { useCurrency } from '../../../shared/context/CurrencyContext';
import { useMenus } from '../../catalog/hooks/useMenus';
import { useMenuItems } from '../../catalog/hooks/useMenuItems';
import { useCategories, useModifierGroups } from '../../catalog/hooks/useMenuPageData';
import { useModifiers } from '../../catalog/hooks/useModifiers';

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
  availableChildren: CatalogEntry[];
  availLoading: boolean;
  onApply: (key: string, patch: Partial<BranchNode>) => Promise<void>;
  onAddChild: (parentKey: string, entry: CatalogEntry) => Promise<void>;
}> = ({ node, availableChildren, availLoading, onApply, onAddChild }) => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [avail, setAvail] = useState<ServiceAvailability[]>([]);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { currencySymbol } = useCurrency();

  // Every parent level gets an "add from tenant" picker (menu→category,
  // category→item, item→modifier group, group→modifier). Picking inserts the
  // branch-level row via the matching assign endpoint.
  const canAssignChildren = node.type !== 'modifier';

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
    setApplying(true);
    try {
      await onApply(node.key, {
        isEnabled: vals.isEnabled, isSoldOut: vals.isSoldOut,
        branchPrice: vals.branchPrice ?? undefined,
        serviceAvailabilities: avail, variants,
      });
    } finally {
      setApplying(false);
    }
  };

  const handleAssign = async (entry: CatalogEntry) => {
    setAssigningId(entry.id);
    try {
      await onAddChild(node.key, entry);
    } finally {
      setAssigningId(null);
    }
  };

  // ── Children tab ──────────────────────────────────────────────────────────
  const filteredAssigned = node.children.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const assignedIds = new Set(node.children.map(c => c.id));
  const filteredAvailable = availableChildren.filter(
    a => !assignedIds.has(a.id) && a.name.toLowerCase().includes(search.toLowerCase()),
  );

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

        {canAssignChildren && (
          <>
            <SectionLabel icon={<PlusCircleOutlined />} label={`Available ${meta.childPlural} to assign`} count={filteredAvailable.length} color={NODE_META[meta.childType!].color} />
            {availLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Spin /></div>
            ) : filteredAvailable.length === 0 ? (
              <div style={{ padding: '24px', borderRadius: 12, textAlign: 'center', border: `2px dashed ${token.colorBorderSecondary}`, background: token.colorFillQuaternary }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {availableChildren.length === 0 ? `All ${meta.childPlural} are already assigned` : 'No matches'}
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredAvailable.map(entry => {
                  const cm = NODE_META[meta.childType!];
                  return (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                      borderRadius: 12, border: `1px dashed ${cm.color}66`,
                      background: token.colorBgContainer,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: cm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: cm.color, fontSize: 16 }}>{cm.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 14, display: 'block' }}>{entry.name}</Text>
                        {entry.subtitle && <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: entry.subtitle }}>{entry.subtitle}</Text>}
                      </div>
                      <Button type="primary" ghost icon={<PlusCircleOutlined />}
                        loading={assigningId === entry.id} onClick={() => handleAssign(entry)}
                        style={{ borderRadius: 8, height: 36, fontWeight: 600, flexShrink: 0 }}>
                        Assign
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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

        <Button type="primary" icon={<SaveOutlined />} block size="large" loading={applying} onClick={handleApply}
          style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10 }}>
          Save Override
        </Button>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          Saved to this branch immediately
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
  availableChildren: CatalogEntry[];
  availLoading: boolean;
  onApply: (key: string, patch: Partial<BranchNode>) => Promise<void>;
  onAddChild: (parentKey: string, entry: CatalogEntry) => Promise<void>;
  availableMenus: CatalogEntry[];
  onAssignMenu: (menuId: string) => Promise<void>;
  assigningMenuId: string | null;
  branchName: string;
}> = ({ node, availableChildren, availLoading, onApply, onAddChild, availableMenus, onAssignMenu, assigningMenuId, branchName }) => {
  const { token } = theme.useToken();
  const [search, setSearch] = useState('');

  if (!node) {
    const filtered = availableMenus.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: token.colorBgContainer }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: `linear-gradient(135deg, #f5f0ff 0%, ${token.colorBgContainer} 60%)`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f0ff', border: '1.5px solid #6132C030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReadOutlined style={{ color: '#6132C0', fontSize: 16 }} />
            </div>
            <Tag style={{ fontSize: 12, fontWeight: 600, color: '#6132C0', borderColor: '#6132C050', background: '#f5f0ff' }}>
              Assign Menus
            </Tag>
          </div>
          <Title level={4} style={{ margin: 0, fontSize: 20 }}>Assign Menus to Branch</Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 2, display: 'block' }}>
            Select from the available tenant-level menus below to assign them to {branchName}.
          </Text>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 24px 12px', flexShrink: 0 }}>
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            placeholder="Search available menus…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            size="large"
          />
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: token.colorFillAlter, borderRadius: 12, border: `2px dashed ${token.colorBorderSecondary}` }}>
              <Empty
                description={
                  availableMenus.length === 0
                    ? "All available menus are already assigned to this branch. Click any assigned item in the tree on the left to configure branch overrides."
                    : "No available menus match your search."
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            filtered.map(menu => (
              <div
                key={menu.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = token.colorPrimaryBorderHover;
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = token.colorBorderSecondary;
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ReadOutlined style={{ color: '#6132C0', fontSize: 20 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 15, display: 'block', color: token.colorText }}>{menu.name}</Text>
                  {menu.subtitle && <Text type="secondary" style={{ fontSize: 12.5, display: 'block', marginTop: 2 }} ellipsis={{ tooltip: menu.subtitle }}>{menu.subtitle}</Text>}
                </div>
                <Button
                  type="primary"
                  ghost
                  icon={<PlusCircleOutlined />}
                  loading={assigningMenuId === menu.id}
                  onClick={() => onAssignMenu(menu.id)}
                  style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
                >
                  Assign
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return <DetailPanelContent key={node.key} node={node} availableChildren={availableChildren} availLoading={availLoading} onApply={onApply} onAddChild={onAddChild} />;
};

// ─── Tree row ─────────────────────────────────────────────────────────────────

const TreeRow: React.FC<{
  node: BranchNode; depth: number; isSelected: boolean; isExpanded: boolean;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void;
  onToggle: (key: string, v: boolean) => void;
  onRemove: (node: BranchNode) => void;
}> = ({ node, depth, isSelected, isExpanded, onSelect, onExpand, onToggle, onRemove }) => {
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
  loadingKeys: Set<string>;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void;
  onToggle: (key: string, v: boolean) => void; onRemove: (n: BranchNode) => void;
}> = ({ nodes, depth, expandedKeys, selectedKey, loadingKeys, onSelect, onExpand, onToggle, onRemove }) => {
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
              onSelect={onSelect} onExpand={onExpand} onToggle={onToggle} onRemove={onRemove}
            />
            {expandedKeys.has(node.key) && (
              <div style={{ marginLeft: 20, borderLeft: `2px solid ${meta.color}20`, paddingLeft: 4 }}>
                {isLoading ? (
                  <div style={{ padding: '6px 12px' }}><Spin size="small" /></div>
                ) : node.children.length > 0 ? (
                  <RenderTree nodes={node.children} depth={depth + 1}
                    expandedKeys={expandedKeys} selectedKey={selectedKey}
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSearch, setAssignSearch]           = useState('');

  // ── Loading states ────────────────────────────────────────────────────────
  const [treeLoading, setTreeLoading]   = useState(false);
  const [loadingKeys, setLoadingKeys]   = useState<Set<string>>(new Set());

  // Refs for loaded/loading sets so loadChildren never has stale closure issues
  const loadedKeysRef  = useRef<Set<string>>(new Set());
  const loadingKeysRef = useRef<Set<string>>(new Set());

  // ── Tenant catalog (for assign pickers) ───────────────────────────────────
  // Reuses the existing tenant-level endpoints — available children are derived
  // client-side (all minus already-assigned), the same way menus already work.
  const { data: menusData }          = useMenus(true);
  const { data: categoriesData }     = useCategories();
  const { data: itemsData }          = useMenuItems();
  const { data: modifierGroupsData } = useModifierGroups();
  const { data: modifiersData }      = useModifiers();

  const allItems: CatalogEntry[] = useMemo(
    () => (itemsData || []).map(i => ({ id: i.id, name: i.name, subtitle: i.description })),
    [itemsData],
  );

  const allModifierGroups: CatalogEntry[] = useMemo(
    () => (modifierGroupsData || []).map(g => ({ id: g.id, name: g.name, subtitle: g.description })),
    [modifierGroupsData],
  );

  const allModifiers: CatalogEntry[] = useMemo(
    () => (modifiersData || []).map(m => ({ id: m.id, name: m.name, basePrice: m.price })),
    [modifiersData],
  );
  const allMenus: CatalogEntry[] = useMemo(
    () => (menusData || []).map((m) => ({ id: m.id, name: m.title, subtitle: m.subtitle })),
    [menusData],
  );

  // Full tenant category catalog — any of these can be added to a branch menu
  // (BranchMenuCategory accepts any category, not just the menu's own).
  const allCategories: CatalogEntry[] = useMemo(
    () => (categoriesData || []).map(c => ({ id: c.id, name: c.name, subtitle: c.description })),
    [categoriesData],
  );

  // Per-category item list + per-item modifier-group list, from the tenant `/api/items`.
  const itemsByCategory = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    (itemsData || []).forEach(i => {
      const list = map.get(i.categoryId) ?? [];
      list.push({ id: i.id, name: i.name, subtitle: i.description });
      map.set(i.categoryId, list);
    });
    return map;
  }, [itemsData]);

  const modifierGroupsByItem = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    (itemsData || []).forEach(i =>
      map.set(i.id, (i.modifierGroups || []).map(g => ({
        id: (g as any).modifierGroupId || g.id,
        name: g.name,
        subtitle: g.description || `Min ${(g as any).minSelectCount ?? 0} / Max ${(g as any).maxSelectCount ?? 0}`
      }))),
    );
    return map;
  }, [itemsData]);

  // Per-group modifier list, resolved from the tenant `/api/modifier-groups`.
  const modifiersByGroup = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    (modifierGroupsData || []).forEach(g =>
      map.set(g.id, (g.modifierItems || []).map(mi => ({
        id: mi.modifierId, name: mi.modifierName ?? 'Modifier', basePrice: mi.price,
      }))),
    );
    return map;
  }, [modifierGroupsData]);

  // ── In-flight action state (replaces the batch "pending" model) ───────────
  const [assigningMenuId, setAssigningMenuId] = useState<string | null>(null);

  // ── Init — load menus from API on open ───────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setTree([]);
    setExpandedKeys(new Set());
    setSelectedKey(null); setSelectedNode(null);
    setTreeSearch('');
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

  const handleSelect = (node: BranchNode) => {
    setSelectedKey(node.key);
    setSelectedNode(node);
    // Lazy-load the branch's already-assigned children so the "Assigned to this
    // branch" list (and the available-picker filter) reflect what's actually there.
    if (node.type !== 'modifier') loadChildren(node);
  };

  // Helper: find a node's parent (needed for category → menu context).
  const findParent = (nodes: BranchNode[], targetKey: string): BranchNode | null => {
    for (const n of nodes) {
      if (n.children.some(c => c.key === targetKey)) return n;
      const found = findParent(n.children, targetKey);
      if (found) return found;
    }
    return null;
  };

  // ── Single-call override (toggle + Save Override) with optimistic rollback ──
  const persistOverride = async (node: BranchNode): Promise<boolean> => {
    const avail = node.serviceAvailabilities ?? [];
    switch (node.type) {
      case 'menu':
        return (await BranchCatalogService.updateMenu(branch.id, node.id, { isEnabled: node.isEnabled, serviceAvailabilities: avail })).success;
      case 'category':
        return (await BranchCatalogService.updateCategory(branch.id, node.id, { isEnabled: node.isEnabled, serviceAvailabilities: avail })).success;
      case 'item':
        return (await BranchCatalogService.updateItem(branch.id, node.id, {
          isEnabled: node.isEnabled, isSoldOut: node.isSoldOut ?? false, serviceAvailabilities: avail,
          variants: (node.variants ?? []).map(v => ({ itemVariantId: v.itemVariantId, isEnabled: v.isEnabled, price: v.branchPrice })),
        })).success;
      case 'modifierGroup':
        return (await BranchCatalogService.updateModifierGroup(branch.id, node.id, { isEnabled: node.isEnabled, serviceAvailabilities: avail })).success;
      case 'modifier':
        return (await BranchCatalogService.updateModifier(branch.id, node.id, { isEnabled: node.isEnabled, price: node.branchPrice, serviceAvailabilities: avail })).success;
      default:
        return false;
    }
  };

  // Tree-row enable/disable switch → optimistic single-call.
  const handleToggle = async (key: string, v: boolean) => {
    const node = findNode(tree, key);
    if (!node) return;
    const prev = node.isEnabled;
    setTree(t => updateNode(t, key, { isEnabled: v }));
    const ok = await persistOverride({ ...node, isEnabled: v });
    if (!ok) {
      setTree(t => updateNode(t, key, { isEnabled: prev }));
      message.error(`Could not update "${node.name}"`);
    }
  };

  // Right-panel "Save Override" → optimistic single-call.
  const handleApplyOverride = async (key: string, patch: Partial<BranchNode>) => {
    const node = findNode(tree, key);
    if (!node) return;
    const before = node;
    setTree(t => updateNode(t, key, patch));
    const ok = await persistOverride({ ...node, ...patch });
    if (ok) {
      message.success({ content: `Saved to ${branch.name}`, duration: 2 });
    } else {
      setTree(t => updateNode(t, key, {
        isEnabled: before.isEnabled, isSoldOut: before.isSoldOut,
        branchPrice: before.branchPrice, serviceAvailabilities: before.serviceAvailabilities,
        variants: before.variants,
      }));
      message.error(`Could not save "${node.name}"`);
    }
  };

  // Assign-picker → optimistic add + single-call assign.
  const handleAddChild = async (parentKey: string, entry: CatalogEntry) => {
    const parent = findNode(tree, parentKey);
    if (!parent) return;
    const childType = NODE_META[parent.type].childType!;
    const child = mk(childType, entry.id, entry.name, true, { subtitle: entry.subtitle, basePrice: entry.basePrice });
    setTree(t => addChild(t, parentKey, child));
    setExpandedKeys(prev => new Set([...prev, parentKey]));

    let ok = false;
    switch (childType) {
      case 'category':     ok = (await BranchCatalogService.addCategoryToMenu(branch.id, parent.id, entry.id)).success; break;
      case 'item':         ok = (await BranchCatalogService.assignItem(branch.id, entry.id)).success; break;
      case 'modifierGroup':ok = (await BranchCatalogService.assignModifierGroup(branch.id, entry.id)).success; break;
      case 'modifier':     ok = (await BranchCatalogService.assignModifier(branch.id, entry.id)).success; break;
    }

    if (ok) {
      message.success({ content: `"${entry.name}" assigned to ${branch.name}`, duration: 2, icon: <PlusCircleOutlined /> });
      // Adding a category cascades its items (+ modifier groups/modifiers) on the
      // backend — load the new node's children so the cascaded subtree shows.
      if (childType === 'category') await loadChildren(child);
    } else {
      setTree(t => removeNode(t, child.key));
      message.error(`Could not assign "${entry.name}"`);
    }
  };

  // Tree-row remove → optimistic unassign + single-call.
  const handleRemoveNode = async (node: BranchNode) => {
    const parent = findParent(tree, node.key);
    const snapshot = tree;
    setTree(t => removeNode(t, node.key));
    if (selectedKey === node.key) { setSelectedKey(null); setSelectedNode(null); }

    let ok = false;
    switch (node.type) {
      case 'menu':          ok = (await BranchCatalogService.unassignMenu(branch.id, node.id)).success; break;
      case 'category':      ok = (await BranchCatalogService.removeCategoryFromMenu(branch.id, parent?.id ?? '', node.id)).success; break;
      case 'item':          ok = (await BranchCatalogService.unassignItem(branch.id, node.id)).success; break;
      case 'modifierGroup': ok = (await BranchCatalogService.unassignModifierGroup(branch.id, node.id)).success; break;
      case 'modifier':      ok = (await BranchCatalogService.unassignModifier(branch.id, node.id)).success; break;
    }

    if (ok) {
      message.success({ content: `"${node.name}" removed from ${branch.name}`, duration: 2, icon: <MinusCircleOutlined /> });
    } else {
      setTree(snapshot); // restore the full previous tree
      message.error(`Could not remove "${node.name}"`);
    }
  };

  // Assign a tenant menu to the branch → optimistic add + single-call.
  const handleAssignMenu = async (menuId: string) => {
    const entry = allMenus.find(m => m.id === menuId);
    if (!entry) return;
    const node = mk('menu', entry.id, entry.name, true, { subtitle: entry.subtitle });
    setAssigningMenuId(menuId);
    setTree(t => [...t, node]);
    setExpandedKeys(prev => new Set([...prev, node.key]));
    try {
      const ok = (await BranchCatalogService.assignMenu(branch.id, entry.id)).success;
      if (ok) {
        message.success({ content: `Menu "${entry.name}" assigned to ${branch.name}`, duration: 2, icon: <PlusCircleOutlined /> });
        // The backend cascade just created the branch hierarchy — load the menu's
        // categories so they show under "Assigned" and drop out of the picker.
        await loadChildren(node);
        setSelectedKey(node.key);
      } else {
        setTree(t => removeNode(t, node.key));
        message.error(`Could not assign menu "${entry.name}"`);
      }
    } finally {
      setAssigningMenuId(null);
    }
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

  // Available children for the selected node's assign picker (tenant minus assigned).
  const availableChildren: CatalogEntry[] = useMemo(() => {
    if (!selectedNode) return [];
    switch (selectedNode.type) {
      case 'menu':          return allCategories;
      case 'category':      return allItems;
      case 'item':          return allModifierGroups;
      case 'modifierGroup': return allModifiers;
      default:              return [];
    }
  }, [selectedNode, allCategories, allItems, allModifierGroups, allModifiers]);

  const availLoading =
    (selectedNode?.type === 'menu' && !categoriesData) ||
    (selectedNode?.type === 'category' && !itemsData) ||
    (selectedNode?.type === 'item' && !modifierGroupsData) ||
    (selectedNode?.type === 'modifierGroup' && !modifiersData);

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
        </div>
      }
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Tree (55%) ── */}
        <div style={{ width: '55%', flexShrink: 0, borderRight: `1px solid ${token.colorBorderSecondary}`, display: 'flex', flexDirection: 'column', background: token.colorBgContainer }}>

          {/* Toolbar */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Input prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="Search the hierarchy…" value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)} allowClear size="large" style={{ flex: 1 }} />
            <Button type="text" size="large" style={{ color: token.colorTextSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}
              onClick={() => expandedKeys.size > 0 ? setExpandedKeys(new Set()) : expandAll()}>
              {expandedKeys.size > 0 ? '⊟ Collapse' : '⊞ Expand'}
            </Button>
            <Button type="primary" size="large" icon={<PlusCircleOutlined />}
              onClick={() => { setSelectedKey(null); setSelectedNode(null); }}
              style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
              Assign Menus
            </Button>
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
          </div>

          {/* Tree */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 24px' }}>
            {treeLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}><Spin size="large" /></div>
            ) : tree.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ fontSize: 14 }}>No menus assigned to this branch</Text>} style={{ marginTop: 80 }}>
                <Button type="primary" size="large" icon={<PlusCircleOutlined />} onClick={() => { setSelectedKey(null); setSelectedNode(null); }}>Assign Menus</Button>
              </Empty>
            ) : (
              <RenderTree nodes={tree} depth={0}
                expandedKeys={expandedKeys} selectedKey={selectedKey}
                loadingKeys={loadingKeys}
                onSelect={handleSelect} onExpand={handleExpand} onToggle={handleToggle} onRemove={handleRemoveNode}
              />
            )}
          </div>
        </div>

        {/* ── Right: Detail panel (45%) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgLayout }}>
          <DetailPanel
            node={selectedNode}
            availableChildren={availableChildren}
            availLoading={availLoading}
            onApply={handleApplyOverride}
            onAddChild={handleAddChild}
            availableMenus={availableMenus}
            onAssignMenu={handleAssignMenu}
            assigningMenuId={assigningMenuId}
            branchName={branch.name}
          />
        </div>
      </div>
    </Drawer>
  );
};

export default BranchCatalogView;
