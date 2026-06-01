import React, { useEffect, useState } from 'react';
import {
  Button, Divider, Drawer, Empty, Form, Input, InputNumber,
  Popconfirm, Select, Space, Switch, Table, Tabs, Tag,
  TimePicker, Tooltip, Typography, message, theme,
} from 'antd';
import {
  AppstoreOutlined, CaretDownFilled, CaretRightFilled,
  CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled,
  MinusCircleOutlined, PlusCircleOutlined, ReadOutlined,
  SaveOutlined, SearchOutlined, ShopOutlined, TagOutlined,
  UnorderedListOutlined, WarningFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Branch, BranchItemVariantAssignment, ServiceAvailability } from '../../../shared/types';

const { Text, Title } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = 'menu' | 'category' | 'item' | 'modifierGroup' | 'modifier';

interface BranchNode {
  key: string; type: NodeType; id: string; name: string; subtitle?: string;
  isEnabled: boolean; isSoldOut?: boolean; basePrice?: number; branchPrice?: number;
  serviceAvailabilities: ServiceAvailability[];
  variants: BranchItemVariantAssignment[];
  children: BranchNode[];
}

interface CatalogEntry { id: string; name: string; subtitle?: string; basePrice?: number }

// ─── Catalog data (replace with API calls later) ──────────────────────────────

const CATALOG_MENUS: CatalogEntry[] = [
  { id: 'm1', name: 'Breakfast Menu',  subtitle: '6:00 am – 11:00 am' },
  { id: 'm2', name: 'All-Day Menu',    subtitle: 'Available all day' },
  { id: 'm3', name: 'Lunch & Dinner',  subtitle: '11:30 am – 10:00 pm' },
  { id: 'm4', name: 'Kids Special',    subtitle: 'Weekend only' },
  { id: 'm5', name: 'Happy Hour',      subtitle: '4:00 pm – 7:00 pm' },
];
const CATALOG_CATEGORIES: CatalogEntry[] = [
  { id: 'c1', name: 'Hot Beverages',   subtitle: 'Coffee, tea & hot drinks' },
  { id: 'c2', name: 'Cold Beverages',  subtitle: 'Iced drinks & smoothies' },
  { id: 'c3', name: 'Pastries',        subtitle: 'Croissants, muffins & more' },
  { id: 'c4', name: 'Breakfast Mains', subtitle: 'Full plates & egg dishes' },
  { id: 'c5', name: 'Sandwiches',      subtitle: 'Hot & cold sandwiches' },
  { id: 'c6', name: 'Salads',          subtitle: 'Fresh garden & grain bowls' },
  { id: 'c7', name: 'Burgers',         subtitle: 'Gourmet beef & plant-based' },
  { id: 'c8', name: 'Pasta',           subtitle: 'Classic Italian pasta' },
  { id: 'c9', name: 'Desserts',        subtitle: 'Cakes, tarts & ice cream' },
];
const CATALOG_ITEMS: Record<string, CatalogEntry[]> = {
  c1: [{ id: 'i1', name: 'Espresso', subtitle: 'Double shot espresso' }, { id: 'i2', name: 'Flat White', subtitle: 'Smooth & creamy' }, { id: 'i3', name: 'Chai Latte', subtitle: 'Spiced tea latte' }, { id: 'i4', name: 'Cappuccino', subtitle: 'Foamy espresso' }, { id: 'i5', name: 'Americano', subtitle: 'Espresso with water' }],
  c2: [{ id: 'i6', name: 'Iced Coffee', subtitle: 'Cold brew over ice' }, { id: 'i7', name: 'Mango Smoothie', subtitle: 'Fresh mango blend' }, { id: 'i8', name: 'Berry Blend', subtitle: 'Mixed berry smoothie' }],
  c3: [{ id: 'i9', name: 'Butter Croissant', subtitle: 'Classic French pastry' }, { id: 'i10', name: 'Blueberry Muffin', subtitle: 'Soft & moist muffin' }, { id: 'i11', name: 'Almond Danish', subtitle: 'Flaky pastry' }],
  c4: [{ id: 'i12', name: 'Full English', subtitle: 'Eggs, bacon, toast' }, { id: 'i13', name: 'Eggs Benedict', subtitle: 'Poached eggs on toast' }, { id: 'i14', name: 'Avocado Toast', subtitle: 'Smashed avo on sourdough' }],
  c5: [{ id: 'i15', name: 'Club Sandwich', subtitle: 'Triple decker classic' }, { id: 'i16', name: 'BLT', subtitle: 'Bacon, lettuce, tomato' }, { id: 'i17', name: 'Chicken Wrap', subtitle: 'Grilled chicken wrap' }],
  c6: [{ id: 'i18', name: 'Garden Salad', subtitle: 'Fresh seasonal greens' }, { id: 'i19', name: 'Caesar Salad', subtitle: 'With anchovies & croutons' }],
  c7: [{ id: 'i20', name: 'Classic Burger', subtitle: '180g beef patty' }, { id: 'i21', name: 'Plant Burger', subtitle: 'Beyond meat patty' }, { id: 'i22', name: 'Chicken Burger', subtitle: 'Crispy fried chicken' }],
  c8: [{ id: 'i23', name: 'Spaghetti Bolognese', subtitle: 'Slow-cooked beef ragu' }, { id: 'i24', name: 'Penne Arrabbiata', subtitle: 'Spicy tomato sauce' }, { id: 'i25', name: 'Carbonara', subtitle: 'Creamy egg & pancetta' }],
  c9: [{ id: 'i26', name: 'Chocolate Lava Cake', subtitle: 'Warm with ice cream' }, { id: 'i27', name: 'Tiramisu', subtitle: 'Italian coffee dessert' }, { id: 'i28', name: 'Cheesecake', subtitle: 'New York style' }],
};
const CATALOG_MOD_GROUPS: Record<string, CatalogEntry[]> = {
  i1: [{ id: 'mg1', name: 'Milk Options', subtitle: 'Choose your milk' }, { id: 'mg2', name: 'Syrups', subtitle: 'Flavoured syrups' }, { id: 'mg3', name: 'Temperature', subtitle: 'Hot or warm' }],
  i2: [{ id: 'mg1', name: 'Milk Options', subtitle: 'Choose your milk' }, { id: 'mg2', name: 'Syrups', subtitle: 'Flavoured syrups' }],
  i3: [{ id: 'mg1', name: 'Milk Options', subtitle: 'Choose your milk' }],
  i4: [{ id: 'mg1', name: 'Milk Options', subtitle: 'Choose your milk' }, { id: 'mg4', name: 'Extra Shots', subtitle: 'Additional espresso shots' }],
  i20: [{ id: 'mg5', name: 'Extras', subtitle: 'Add-ons for the burger' }, { id: 'mg6', name: 'Cooking Style', subtitle: 'Doneness preference' }, { id: 'mg7', name: 'Sauce', subtitle: 'Choose your sauce' }],
  i21: [{ id: 'mg5', name: 'Extras', subtitle: 'Add-ons' }, { id: 'mg7', name: 'Sauce', subtitle: 'Choose your sauce' }],
  i12: [{ id: 'mg8', name: 'Egg Style', subtitle: 'How you like your eggs' }],
};
const CATALOG_MODIFIERS: Record<string, CatalogEntry[]> = {
  mg1: [{ id: 'mod1', name: 'Full Cream', basePrice: 0 }, { id: 'mod2', name: 'Oat Milk', basePrice: 0.80 }, { id: 'mod3', name: 'Almond Milk', basePrice: 0.80 }, { id: 'mod4', name: 'Soy Milk', basePrice: 0.60 }, { id: 'mod5', name: 'Coconut Milk', basePrice: 0.80 }],
  mg2: [{ id: 'mod6', name: 'Vanilla', basePrice: 0.50 }, { id: 'mod7', name: 'Caramel', basePrice: 0.50 }, { id: 'mod8', name: 'Hazelnut', basePrice: 0.50 }, { id: 'mod9', name: 'Lavender', basePrice: 0.60 }],
  mg3: [{ id: 'mod10', name: 'Hot', basePrice: 0 }, { id: 'mod11', name: 'Warm', basePrice: 0 }],
  mg4: [{ id: 'mod12', name: 'Single Extra', basePrice: 0.60 }, { id: 'mod13', name: 'Double Extra', basePrice: 1.20 }],
  mg5: [{ id: 'mod14', name: 'Extra Cheese', basePrice: 1.50 }, { id: 'mod15', name: 'Bacon', basePrice: 2.00 }, { id: 'mod16', name: 'Avocado', basePrice: 2.50 }, { id: 'mod17', name: 'Fried Egg', basePrice: 1.00 }],
  mg6: [{ id: 'mod18', name: 'Rare', basePrice: 0 }, { id: 'mod19', name: 'Medium Rare', basePrice: 0 }, { id: 'mod20', name: 'Medium', basePrice: 0 }, { id: 'mod21', name: 'Well Done', basePrice: 0 }],
  mg7: [{ id: 'mod22', name: 'Tomato Sauce', basePrice: 0 }, { id: 'mod23', name: 'BBQ Sauce', basePrice: 0 }, { id: 'mod24', name: 'Aioli', basePrice: 0 }],
  mg8: [{ id: 'mod25', name: 'Scrambled', basePrice: 0 }, { id: 'mod26', name: 'Fried', basePrice: 0 }, { id: 'mod27', name: 'Poached', basePrice: 0 }],
};

// ─── Node config ──────────────────────────────────────────────────────────────

const NODE_META: Record<NodeType, {
  icon: React.ReactNode; color: string; bg: string;
  childType: NodeType | null; childLabel: string; childPlural: string;
  catalogPool: (id: string) => CatalogEntry[];
}> = {
  menu:          { icon: <ReadOutlined />,          color: '#6132C0', bg: '#f5f0ff', childType: 'category',     childLabel: 'Category',       childPlural: 'categories',      catalogPool: () => CATALOG_CATEGORIES },
  category:      { icon: <AppstoreOutlined />,      color: '#1677ff', bg: '#e6f4ff', childType: 'item',          childLabel: 'Item',           childPlural: 'items',           catalogPool: id => CATALOG_ITEMS[id] ?? [] },
  item:          { icon: <UnorderedListOutlined />, color: '#389e0d', bg: '#f6ffed', childType: 'modifierGroup', childLabel: 'Modifier Group', childPlural: 'modifier groups', catalogPool: id => CATALOG_MOD_GROUPS[id] ?? [] },
  modifierGroup: { icon: <TagOutlined />,           color: '#d46b08', bg: '#fff7e6', childType: 'modifier',      childLabel: 'Modifier',       childPlural: 'modifiers',       catalogPool: id => CATALOG_MODIFIERS[id] ?? [] },
  modifier:      { icon: <TagOutlined />,           color: '#c41d7f', bg: '#fff0f6', childType: null,             childLabel: '',               childPlural: '',                catalogPool: () => [] },
};

// ─── Tree helpers ─────────────────────────────────────────────────────────────

const ALL_WEEK: ServiceAvailability[] = [1,2,3,4,5].map(d => ({ dayOfWeek: d, startTime: '08:00', endTime: '22:00' }));
const WEEKEND:  ServiceAvailability[] = [0,6].map(d => ({ dayOfWeek: d, startTime: '09:00', endTime: '21:00' }));

const mk = (type: NodeType, id: string, name: string, enabled: boolean, extra: Partial<BranchNode> = {}): BranchNode => ({
  key: `${type}::${id}`, type, id, name, isEnabled: enabled,
  serviceAvailabilities: extra.serviceAvailabilities ?? ALL_WEEK,
  variants: extra.variants ?? [], children: extra.children ?? [], ...extra,
});

const buildInitialTree = (): BranchNode[] => [
  mk('menu', 'm1', 'Breakfast Menu', true, {
    subtitle: '6:00 am – 11:00 am', serviceAvailabilities: [...ALL_WEEK, ...WEEKEND],
    children: [
      mk('category', 'c1', 'Hot Beverages', true, {
        children: [
          mk('item', 'i1', 'Espresso', true, {
            subtitle: 'Double shot espresso',
            variants: [
              { itemVariantId: 'iv1', variantName: 'Single', basePrice: 3.50, isEnabled: true },
              { itemVariantId: 'iv2', variantName: 'Double', basePrice: 4.50, branchPrice: 4.00, isEnabled: true },
            ],
            children: [
              mk('modifierGroup', 'mg1', 'Milk Options', true, {
                subtitle: 'Min 1 / Max 1',
                children: [
                  mk('modifier', 'mod1', 'Full Cream',  true,  { basePrice: 0 }),
                  mk('modifier', 'mod2', 'Oat Milk',    true,  { basePrice: 0.80 }),
                  mk('modifier', 'mod3', 'Almond Milk', false, { basePrice: 0.80 }),
                ],
              }),
            ],
          }),
          mk('item', 'i2', 'Flat White', true, {
            subtitle: 'Smooth & creamy',
            variants: [
              { itemVariantId: 'iv3', variantName: 'Regular', basePrice: 4.50, isEnabled: true },
              { itemVariantId: 'iv4', variantName: 'Large',   basePrice: 5.50, isEnabled: false },
            ],
            children: [
              mk('modifierGroup', 'mg1', 'Milk Options', true, {
                subtitle: 'Min 1 / Max 1',
                children: [
                  mk('modifier', 'mod1', 'Full Cream', true, { basePrice: 0 }),
                  mk('modifier', 'mod2', 'Oat Milk',   true, { basePrice: 0.80 }),
                ],
              }),
            ],
          }),
        ],
      }),
      mk('category', 'c3', 'Pastries', true, {
        children: [
          mk('item', 'i9',  'Butter Croissant', true,  { subtitle: 'Classic French pastry' }),
          mk('item', 'i10', 'Blueberry Muffin', true,  { subtitle: 'Soft & moist muffin' }),
          mk('item', 'i11', 'Almond Danish',    false, { subtitle: 'Flaky pastry' }),
        ],
      }),
    ],
  }),
  mk('menu', 'm2', 'All-Day Menu', true, {
    subtitle: 'Available all day', serviceAvailabilities: [...ALL_WEEK, ...WEEKEND],
    children: [
      mk('category', 'c2', 'Cold Beverages', true, {
        children: [
          mk('item', 'i6', 'Iced Coffee',    true, { subtitle: 'Cold brew over ice' }),
          mk('item', 'i7', 'Mango Smoothie', true, { subtitle: 'Fresh mango blend' }),
        ],
      }),
      mk('category', 'c5', 'Sandwiches', true, {
        children: [
          mk('item', 'i15', 'Club Sandwich', true, { subtitle: 'Triple decker classic' }),
          mk('item', 'i16', 'BLT',           true, { subtitle: 'Bacon, lettuce, tomato' }),
        ],
      }),
    ],
  }),
  mk('menu', 'm3', 'Lunch & Dinner', false, {
    subtitle: '11:30 am – 10:00 pm',
    children: [
      mk('category', 'c7', 'Burgers', true, {
        children: [
          mk('item', 'i20', 'Classic Burger', true, {
            subtitle: '180g beef patty',
            variants: [
              { itemVariantId: 'iv5', variantName: 'Regular', basePrice: 12.00, isEnabled: true },
              { itemVariantId: 'iv6', variantName: 'Large',   basePrice: 14.00, isEnabled: true },
            ],
            children: [
              mk('modifierGroup', 'mg5', 'Extras', true, {
                subtitle: 'Min 0 / Max 5',
                children: [
                  mk('modifier', 'mod14', 'Extra Cheese', true,  { basePrice: 1.50, branchPrice: 1.20 }),
                  mk('modifier', 'mod15', 'Bacon',        true,  { basePrice: 2.00 }),
                  mk('modifier', 'mod16', 'Avocado',      false, { basePrice: 2.50 }),
                ],
              }),
            ],
          }),
        ],
      }),
      mk('category', 'c8', 'Pasta', true, {
        children: [
          mk('item', 'i23', 'Spaghetti Bolognese', true, { subtitle: 'Slow-cooked beef ragu' }),
          mk('item', 'i24', 'Penne Arrabbiata',    true, { subtitle: 'Spicy tomato sauce' }),
        ],
      }),
    ],
  }),
];

// ─── Pure tree operations ─────────────────────────────────────────────────────

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

const AvailabilityEditor: React.FC<{
  value: ServiceAvailability[]; onChange: (v: ServiceAvailability[]) => void;
}> = ({ value, onChange }) => {
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
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 8, minHeight: 44,
            background: on ? token.colorPrimaryBg : token.colorFillQuaternary,
            border: `1px solid ${on ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
            transition: 'all 0.2s',
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
      <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: token.colorTextSecondary }}>
        {label}
      </Text>
      {count !== undefined && (
        <div style={{
          height: 20, minWidth: 20, padding: '0 6px', borderRadius: 10,
          background: token.colorFillSecondary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary }}>{count}</Text>
        </div>
      )}
      <div style={{ flex: 1, height: 1, background: token.colorBorderSecondary }} />
    </div>
  );
};

// ─── Right panel ─────────────────────────────────────────────────────────────

const RightPanel: React.FC<{
  node: BranchNode | null;
  onSaveOverride: (key: string, patch: Partial<BranchNode>) => void;
  onAddChild:     (parentKey: string, entry: CatalogEntry) => void;
  onRemoveChild:  (childKey: string) => void;
}> = ({ node, onSaveOverride, onAddChild, onRemoveChild }) => {
  const { token } = theme.useToken();
  const [form]    = Form.useForm();
  const [avail, setAvail]   = useState<ServiceAvailability[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!node) return;
    form.resetFields();
    form.setFieldsValue({ isEnabled: node.isEnabled, isSoldOut: node.isSoldOut ?? false, branchPrice: node.branchPrice ?? null });
    (node.variants ?? []).forEach(v => {
      form.setFieldValue(`ve_${v.itemVariantId}`, v.isEnabled);
      form.setFieldValue(`vp_${v.itemVariantId}`, v.branchPrice ?? null);
    });
    setAvail(node.serviceAvailabilities ?? []);
    setSearch('');
  }, [node?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (!node) return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, padding: 48,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `linear-gradient(135deg, ${token.colorPrimaryBg}, ${token.colorFillSecondary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ShopOutlined style={{ fontSize: 32, color: token.colorPrimary, opacity: 0.4 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 600, display: 'block', color: token.colorTextSecondary }}>
          Nothing selected
        </Text>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Click any item in the hierarchy tree to configure its branch settings
        </Text>
      </div>
    </div>
  );

  const meta    = NODE_META[node.type];
  const isItem  = node.type === 'item';
  const isMod   = node.type === 'modifier';
  const hasKids = node.type !== 'modifier';

  const usedIds           = new Set(node.children.map(c => c.id));
  const available         = meta.catalogPool(node.id).filter(e => !usedIds.has(e.id));
  const filteredAssigned  = node.children.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredAvailable = available.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    const vals = await form.validateFields();
    setSaving(true);
    const variants = (node.variants ?? []).map(v => ({
      ...v, isEnabled: vals[`ve_${v.itemVariantId}`] ?? v.isEnabled, branchPrice: vals[`vp_${v.itemVariantId}`] ?? v.branchPrice,
    }));
    setTimeout(() => {
      onSaveOverride(node.key, { isEnabled: vals.isEnabled, isSoldOut: vals.isSoldOut, branchPrice: vals.branchPrice, serviceAvailabilities: avail, variants });
      message.success('Override saved');
      setSaving(false);
    }, 300);
  };

  // ── Children tab ──────────────────────────────────────────────────────────────
  const childrenTab = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px 12px' }}>
        <Input
          size="large"
          prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
          placeholder={`Search ${meta.childPlural}…`}
          value={search} onChange={e => setSearch(e.target.value)} allowClear
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 32px' }}>

        {/* Assigned */}
        <SectionLabel icon={<CheckCircleFilled />} label="Items in this branch" count={node.children.length} color="#389e0d" />

        {filteredAssigned.length === 0 ? (
          <div style={{
            padding: '32px 24px', borderRadius: 12, textAlign: 'center',
            border: `2px dashed ${token.colorBorderSecondary}`,
            background: token.colorFillQuaternary, marginBottom: 28,
          }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {node.children.length === 0
                ? `No ${meta.childPlural} assigned to this branch yet`
                : 'No matches for your search'}
            </Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {filteredAssigned.map(child => {
              const cm = NODE_META[child.type];
              return (
                <div key={child.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgContainer,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                  borderLeft: `3px solid ${cm.color}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: cm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: cm.color, fontSize: 16 }}>{cm.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 14, display: 'block' }}>{child.name}</Text>
                    {child.subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{child.subtitle}</Text>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {child.isEnabled
                      ? <Tag color="success" style={{ fontSize: 12 }}>Enabled</Tag>
                      : <Tag style={{ fontSize: 12 }}>Disabled</Tag>
                    }
                    {child.isSoldOut && <Tag color="warning" style={{ fontSize: 12 }}>Sold Out</Tag>}
                    <Popconfirm
                      title={`Remove "${child.name}"?`}
                      description="Removes from this branch only. The item stays in the global catalog."
                      onConfirm={() => onRemoveChild(child.key)}
                      okText="Remove" okButtonProps={{ danger: true }}
                    >
                      <Tooltip title="Remove from branch">
                        <Button type="text" danger icon={<MinusCircleOutlined style={{ fontSize: 16 }} />} size="small" />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Divider style={{ margin: '0 0 24px' }} />

        {/* Available */}
        <SectionLabel icon={<PlusCircleOutlined />} label="Add items to this branch" count={available.length} color={token.colorPrimary} />

        {available.length === 0 ? (
          <div style={{
            padding: '32px 24px', borderRadius: 12, textAlign: 'center',
            border: `2px dashed ${token.colorBorderSecondary}`,
            background: token.colorFillQuaternary,
          }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              All global {meta.childPlural} are already assigned to this branch
            </Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredAvailable.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 12,
                border: `1.5px dashed ${token.colorBorderSecondary}`,
                background: token.colorFillQuaternary,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, opacity: 0.6,
                }}>
                  <span style={{ color: meta.color, fontSize: 16 }}>
                    {meta.childType ? NODE_META[meta.childType].icon : null}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, color: token.colorTextSecondary, display: 'block' }}>{entry.name}</Text>
                  {entry.subtitle && <Text type="secondary" style={{ fontSize: 12 }}>{entry.subtitle}</Text>}
                </div>
                {entry.basePrice != null && (
                  <Text style={{ fontSize: 13, color: token.colorTextSecondary, fontFamily: 'monospace', flexShrink: 0 }}>
                    ${entry.basePrice.toFixed(2)}
                  </Text>
                )}
                <Button
                  type="primary" ghost size="middle"
                  icon={<PlusCircleOutlined />}
                  onClick={() => onAddChild(node.key, entry)}
                  style={{ flexShrink: 0, fontWeight: 600 }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Overrides tab ─────────────────────────────────────────────────────────────
  const overridesTab = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
      <Form form={form} layout="vertical">

        {/* Status */}
        <SectionLabel label="Status" />
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Enabled at branch
            </Text>
            <Form.Item name="isEnabled" valuePropName="checked" style={{ margin: 0 }}>
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>
          </div>
          {isItem && (
            <div style={{ flex: 1, background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px' }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Sold out
              </Text>
              <Form.Item name="isSoldOut" valuePropName="checked" style={{ margin: 0 }}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </div>
          )}
        </div>

        {/* Price override */}
        {isMod && (
          <>
            <SectionLabel label="Price Override" />
            <div style={{ background: token.colorFillQuaternary, borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Global base price</Text>
                  <div style={{
                    padding: '6px 16px', borderRadius: 8, background: token.colorBgContainer,
                    border: `1px solid ${token.colorBorderSecondary}`,
                  }}>
                    <Text strong style={{ fontSize: 16, fontFamily: 'monospace' }}>${node.basePrice?.toFixed(2)}</Text>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 20 }}>→</Text>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Branch override price</Text>
                  <Form.Item name="branchPrice" style={{ margin: 0 }}>
                    <InputNumber
                      prefix="$" precision={2} min={0}
                      placeholder="Enter branch price…"
                      size="large" style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Variants */}
        {isItem && (node.variants ?? []).length > 0 && (
          <>
            <SectionLabel label="Variants" count={node.variants.length} />
            <div style={{ background: token.colorFillQuaternary, borderRadius: 10, padding: '4px', marginBottom: 24 }}>
              <Table
                size="middle"
                dataSource={node.variants} rowKey="itemVariantId" pagination={false}
                columns={[
                  { title: 'Variant', dataIndex: 'variantName', render: (t: string) => <Text style={{ fontSize: 14 }}>{t}</Text> },
                  { title: 'Base Price', dataIndex: 'basePrice', width: 100,
                    render: (p: number) => <Text style={{ fontSize: 14, fontFamily: 'monospace' }}>${p?.toFixed(2)}</Text> },
                  { title: 'Branch Price', width: 160,
                    render: (_: any, r: any) => (
                      <Form.Item name={`vp_${r.itemVariantId}`} style={{ margin: 0 }} initialValue={r.branchPrice ?? null}>
                        <InputNumber prefix="$" precision={2} min={0} placeholder="Override" style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  { title: 'Enabled', width: 80,
                    render: (_: any, r: any) => (
                      <Form.Item name={`ve_${r.itemVariantId}`} valuePropName="checked" style={{ margin: 0 }} initialValue={r.isEnabled}>
                        <Switch />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            </div>
          </>
        )}

        {/* Availability */}
        <SectionLabel icon={<ClockCircleOutlined />} label="Weekly Availability" count={avail.length} />
        <div style={{ marginBottom: 28 }}>
          <AvailabilityEditor value={avail} onChange={setAvail} />
        </div>

        <Button
          type="primary" icon={<SaveOutlined />} block
          size="large" loading={saving} onClick={handleSave}
          style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 10 }}
        >
          Save Branch Overrides
        </Button>
      </Form>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Identity header */}
      <div style={{
        padding: '20px 24px 16px',
        background: `linear-gradient(135deg, ${meta.bg} 0%, ${token.colorBgContainer} 60%)`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: meta.bg, border: `1.5px solid ${meta.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: meta.color, fontSize: 16 }}>{meta.icon}</span>
          </div>
          <Tag style={{ fontSize: 12, fontWeight: 600, color: meta.color, borderColor: meta.color + '50', background: meta.bg }}>
            {node.type === 'modifierGroup' ? 'Modifier Group' : node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </Tag>
          {node.isEnabled
            ? <Tag icon={<CheckCircleFilled />} color="success" style={{ fontSize: 12 }}>Enabled</Tag>
            : <Tag icon={<CloseCircleFilled />} color="default" style={{ fontSize: 12 }}>Disabled</Tag>
          }
          {node.isSoldOut && <Tag color="warning" icon={<WarningFilled />} style={{ fontSize: 12 }}>Sold Out</Tag>}
          {node.branchPrice != null && node.branchPrice !== node.basePrice && (
            <Tag color="orange" style={{ fontSize: 12 }}>Price Override</Tag>
          )}
        </div>
        <Title level={4} style={{ margin: 0, fontSize: 20 }}>{node.name}</Title>
        {node.subtitle && (
          <Text type="secondary" style={{ fontSize: 14, marginTop: 2, display: 'block' }}>{node.subtitle}</Text>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey={hasKids ? 'children' : 'overrides'}
        style={{ flex: 1, overflow: 'hidden' }}
        tabBarStyle={{
          margin: 0, padding: '0 24px',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          fontSize: 14,
        }}
        size="large"
        items={[
          ...(hasKids ? [{
            key: 'children',
            label: (
              <Space size={6}>
                <span>Manage {meta.childLabel}s</span>
                <div style={{
                  height: 20, minWidth: 20, padding: '0 6px', borderRadius: 10,
                  background: token.colorPrimaryBg, color: token.colorPrimary,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {node.children.length}
                </div>
              </Space>
            ),
            children: (
              <div style={{ height: 'calc(100vh - 310px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {childrenTab}
              </div>
            ),
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

// ─── Tree row ─────────────────────────────────────────────────────────────────

const TreeRow: React.FC<{
  node: BranchNode; depth: number; isSelected: boolean; isExpanded: boolean;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void; onToggle: (key: string, v: boolean) => void;
}> = ({ node, depth, isSelected, isExpanded, onSelect, onExpand, onToggle }) => {
  const { token } = theme.useToken();
  const meta    = NODE_META[node.type];
  const hasKids = node.type !== 'modifier';

  return (
    <div
      onClick={() => onSelect(node)}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        paddingLeft: 8, paddingRight: 14, paddingTop: 6, paddingBottom: 6,
        cursor: 'pointer', borderRadius: 8, minHeight: 44,
        background: isSelected
          ? `linear-gradient(90deg, ${meta.bg} 0%, ${token.colorBgContainer} 100%)`
          : 'transparent',
        borderLeft: isSelected ? `3px solid ${meta.color}` : '3px solid transparent',
        marginBottom: 2, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = token.colorFillTertiary; (e.currentTarget as HTMLElement).style.borderLeftColor = meta.color + '40'; } }}
      onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; } }}
    >
      {/* Expand toggle */}
      <span
        onClick={e => { e.stopPropagation(); if (hasKids) onExpand(node.key); }}
        style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: token.colorTextTertiary, fontSize: 10,
          cursor: hasKids ? 'pointer' : 'default', borderRadius: 4,
        }}
      >
        {hasKids ? (isExpanded ? <CaretDownFilled /> : <CaretRightFilled />) : null}
      </span>

      {/* Type icon pill */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginRight: 10,
        background: isSelected ? meta.bg : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        <span style={{ color: node.isEnabled ? meta.color : token.colorTextQuaternary, fontSize: 14 }}>
          {meta.icon}
        </span>
      </div>

      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text
          ellipsis
          style={{
            fontSize: depth === 0 ? 15 : depth === 1 ? 14 : 13,
            fontWeight: depth === 0 ? 600 : depth === 1 ? 500 : 400,
            display: 'block',
            color: !node.isEnabled
              ? token.colorTextQuaternary
              : isSelected ? meta.color : token.colorText,
          }}
        >
          {node.name}
        </Text>
        {node.subtitle && depth < 3 && (
          <Text type="secondary" style={{ fontSize: 12 }}>{node.subtitle}</Text>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginRight: 8 }}>
        {node.isSoldOut && <WarningFilled style={{ color: '#fa8c16', fontSize: 12 }} />}
        {node.type === 'modifier' && node.branchPrice != null && node.branchPrice !== node.basePrice && (
          <Tag color="orange" style={{ fontSize: 10, padding: '0 5px', margin: 0 }}>✎</Tag>
        )}
        {!node.isEnabled
          ? <CloseCircleFilled style={{ color: token.colorTextQuaternary, fontSize: 12 }} />
          : <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />
        }
      </div>

      {/* Toggle */}
      <Switch
        size="small" checked={node.isEnabled}
        onChange={(v, e) => { e.stopPropagation(); onToggle(node.key, v); }}
        onClick={(_, e) => e.stopPropagation()}
      />
    </div>
  );
};

// ─── Recursive tree ───────────────────────────────────────────────────────────

const RenderTree: React.FC<{
  nodes: BranchNode[]; depth: number;
  expandedKeys: Set<string>; selectedKey: string | null;
  onSelect: (n: BranchNode) => void; onExpand: (key: string) => void; onToggle: (key: string, v: boolean) => void;
}> = ({ nodes, depth, expandedKeys, selectedKey, onSelect, onExpand, onToggle }) => {
  const { token } = theme.useToken();
  return (
    <>
      {nodes.map(node => {
        const meta = NODE_META[node.type];
        return (
          <React.Fragment key={node.key}>
            <TreeRow
              node={node} depth={depth}
              isSelected={selectedKey === node.key}
              isExpanded={expandedKeys.has(node.key)}
              onSelect={onSelect} onExpand={onExpand} onToggle={onToggle}
            />
            {expandedKeys.has(node.key) && (
              <div style={{
                marginLeft: 20,
                borderLeft: `2px solid ${meta.color}20`,
                paddingLeft: 4,
              }}>
                {node.children.length > 0 ? (
                  <RenderTree
                    nodes={node.children} depth={depth + 1}
                    expandedKeys={expandedKeys} selectedKey={selectedKey}
                    onSelect={onSelect} onExpand={onExpand} onToggle={onToggle}
                  />
                ) : node.type !== 'modifier' ? (
                  <div style={{ padding: '6px 12px' }}>
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                      No {NODE_META[node.type].childPlural} — select to manage
                    </Text>
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

// ─── Main component ───────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!open) return;
    const initial = buildInitialTree();
    setTree(initial);
    setExpandedKeys(new Set(initial.map(n => n.key)));
    setSelectedKey(null); setSelectedNode(null); setTreeSearch('');
  }, [open]);

  // Keep selected node in sync with tree
  useEffect(() => {
    if (!selectedKey) return;
    setSelectedNode(findNode(tree, selectedKey));
  }, [tree, selectedKey]);

  const handleExpand = (key: string) =>
    setExpandedKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const handleSelect = (node: BranchNode) => { setSelectedKey(node.key); setSelectedNode(node); };

  const handleToggle = (key: string, v: boolean) => setTree(t => updateNode(t, key, { isEnabled: v }));

  const handleSaveOverride = (key: string, patch: Partial<BranchNode>) =>
    setTree(t => updateNode(t, key, patch));

  const handleAddChild = (parentKey: string, entry: CatalogEntry) => {
    const parent = findNode(tree, parentKey);
    if (!parent) return;
    const childType = NODE_META[parent.type].childType!;
    const child = mk(childType, entry.id, entry.name, true, { subtitle: entry.subtitle, basePrice: entry.basePrice });
    setTree(t => addChild(t, parentKey, child));
    setExpandedKeys(prev => new Set([...prev, parentKey]));
    message.success(`"${entry.name}" added to branch`);
  };

  const handleRemoveChild = (childKey: string) => {
    setTree(t => removeNode(t, childKey));
    if (selectedKey === childKey) { setSelectedKey(null); setSelectedNode(null); }
    message.success('Removed from branch');
  };

  const handleAddMenu = () => {
    const entry = CATALOG_MENUS.find(m => m.id === addMenuId);
    if (!entry) return;
    const node = mk('menu', entry.id, entry.name, true, { subtitle: entry.subtitle });
    setTree(t => [...t, node]);
    setExpandedKeys(prev => new Set([...prev, node.key]));
    setAddMenuOpen(false); setAddMenuId(undefined);
    message.success(`Menu "${entry.name}" added`);
  };

  const usedMenuIds    = new Set(tree.map(n => n.id));
  const availableMenus = CATALOG_MENUS.filter(m => !usedMenuIds.has(m.id));

  const expandAll = () => {
    const all = new Set<string>();
    const w = (ns: BranchNode[]) => ns.forEach(n => { all.add(n.key); w(n.children); });
    w(tree);
    setExpandedKeys(all);
  };

  return (
    <Drawer
      open={open} onClose={onClose} width="92%"
      styles={{
        body:   { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        header: { padding: '14px 24px', borderBottom: `1px solid ${token.colorBorderSecondary}`, background: `linear-gradient(135deg, #f5f0ff 0%, ${token.colorBgContainer} 50%)` },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6132C0,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShopOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <Text style={{ fontSize: 17, fontWeight: 700, display: 'block', lineHeight: 1.2 }}>Branch Menu</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>{branch.name}</Text>
          </div>
          <Tag color="red" style={{ fontSize: 11, marginLeft: 4 }}>Live Data</Tag>
          <div style={{ flex: 1 }} />
          {/* Stats */}
          {([
            { label: 'Menus',   count: tree.length,                 color: '#6132C0' },
            { label: 'Cats',    count: walkCount(tree,'category'),  color: '#1677ff' },
            { label: 'Items',   count: walkCount(tree,'item'),      color: '#389e0d' },
            { label: 'Groups',  count: walkCount(tree,'modifierGroup'), color: '#d46b08' },
            { label: 'Mods',    count: walkCount(tree,'modifier'),  color: '#c41d7f' },
          ]).map(s => (
            <div key={s.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 12px', borderRadius: 8,
              background: s.color + '12', border: `1px solid ${s.color}30`,
            }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.count}</Text>
              <Text style={{ fontSize: 10, color: s.color, opacity: 0.8 }}>{s.label}</Text>
            </div>
          ))}
        </div>
      }
    >
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Tree (55%) ── */}
        <div style={{
          width: '55%', flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex', flexDirection: 'column',
          background: token.colorBgContainer,
        }}>
          {/* Toolbar */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Input
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              placeholder="Search the hierarchy…"
              value={treeSearch} onChange={e => setTreeSearch(e.target.value)}
              allowClear size="large" style={{ flex: 1 }}
            />
            <Button type="text" size="large" style={{ color: token.colorTextSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}
              onClick={() => expandedKeys.size > 0 ? setExpandedKeys(new Set()) : expandAll()}
            >
              {expandedKeys.size > 0 ? '⊟ Collapse' : '⊞ Expand'}
            </Button>
            {addMenuOpen ? (
              <Space size={6}>
                <Select size="large" style={{ width: 180 }} placeholder="Select menu…"
                  value={addMenuId} onChange={setAddMenuId} showSearch optionFilterProp="label"
                  options={availableMenus.map(m => ({ value: m.id, label: m.name }))} autoFocus
                />
                <Button size="large" type="primary" onClick={handleAddMenu} disabled={!addMenuId}>Add</Button>
                <Button size="large" onClick={() => { setAddMenuOpen(false); setAddMenuId(undefined); }}>✕</Button>
              </Space>
            ) : (
              <Button type="dashed" size="large" icon={<PlusCircleOutlined />}
                onClick={() => setAddMenuOpen(true)} disabled={availableMenus.length === 0}
                style={{ whiteSpace: 'nowrap', fontWeight: 500 }}
              >
                Add menu
              </Button>
            )}
          </div>

          {/* Level legend */}
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex', gap: 20, flexWrap: 'wrap', background: token.colorFillQuaternary,
          }}>
            {(Object.entries(NODE_META) as [NodeType, typeof NODE_META[NodeType]][]).map(([type, m]) => (
              <Space key={type} size={6}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: m.color, fontSize: 12 }}>{m.icon}</span>
                </div>
                <Text style={{ fontSize: 12, fontWeight: 500 }}>{type === 'modifierGroup' ? 'Mod Group' : type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </Space>
            ))}
          </div>

          {/* Scrollable tree */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 24px' }}>
            {tree.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ fontSize: 14 }}>No menus assigned to this branch</Text>} style={{ marginTop: 80 }}>
                <Button type="primary" size="large" icon={<PlusCircleOutlined />} onClick={() => setAddMenuOpen(true)}>
                  Add First Menu
                </Button>
              </Empty>
            ) : (
              <RenderTree
                nodes={tree} depth={0}
                expandedKeys={expandedKeys} selectedKey={selectedKey}
                onSelect={handleSelect} onExpand={handleExpand} onToggle={handleToggle}
              />
            )}
          </div>
        </div>

        {/* ── Right: Context panel (45%) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: token.colorBgLayout }}>
          <RightPanel
            node={selectedNode}
            onSaveOverride={handleSaveOverride}
            onAddChild={handleAddChild}
            onRemoveChild={handleRemoveChild}
          />
        </div>
      </div>
    </Drawer>
  );
};

export default BranchCatalogView;
