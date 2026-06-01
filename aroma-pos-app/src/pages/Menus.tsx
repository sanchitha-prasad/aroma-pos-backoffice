import React, { useState } from 'react';
import { Typography } from 'antd';
import { MenuEntity, Category } from '../shared/types';
import MenuManagementView from '../features/catalog/components/MenuManagementView';

const { Title } = Typography;

// ── Dummy data ────────────────────────────────────────────────────────────────
// Remove this block and uncomment the API calls below once the backend is ready.

const DUMMY_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Hot Beverages',   description: 'Coffee, tea & hot drinks',   isActive: true },
  { id: 'cat-2', name: 'Cold Beverages',  description: 'Iced drinks & smoothies',    isActive: true },
  { id: 'cat-3', name: 'Pastries',        description: 'Croissants, muffins & more', isActive: true },
  { id: 'cat-4', name: 'Breakfast Mains', description: 'Full plates & egg dishes',   isActive: true },
  { id: 'cat-5', name: 'Sandwiches',      description: 'Hot & cold sandwiches',      isActive: true },
  { id: 'cat-6', name: 'Salads',          description: 'Fresh garden & grain bowls', isActive: true },
  { id: 'cat-7', name: 'Burgers',         description: 'Gourmet beef & plant-based', isActive: true },
  { id: 'cat-8', name: 'Pasta',           description: 'Classic Italian pasta',      isActive: true },
  { id: 'cat-9', name: 'Desserts',        description: 'Cakes, tarts & ice cream',   isActive: true },
  { id: 'cat-10', name: 'Kids Menu',      description: 'Smaller portions for kids',  isActive: false },
];

const DUMMY_MENUS: MenuEntity[] = [
  {
    id: 'menu-1',
    title: 'Breakfast Menu',
    subtitle: 'Served daily 6:00 am – 11:00 am',
    isActive: true,
    categories: [
      { categoryId: 'cat-1' },
      { categoryId: 'cat-3' },
      { categoryId: 'cat-4' },
    ],
  },
  {
    id: 'menu-2',
    title: 'All-Day Menu',
    subtitle: 'Available all day',
    isActive: true,
    categories: [
      { categoryId: 'cat-1' },
      { categoryId: 'cat-2' },
      { categoryId: 'cat-5' },
      { categoryId: 'cat-6' },
      { categoryId: 'cat-9' },
    ],
  },
  {
    id: 'menu-3',
    title: 'Lunch & Dinner',
    subtitle: 'Served 11:30 am – 10:00 pm',
    isActive: true,
    categories: [
      { categoryId: 'cat-7' },
      { categoryId: 'cat-8' },
      { categoryId: 'cat-6' },
      { categoryId: 'cat-9' },
    ],
  },
  {
    id: 'menu-4',
    title: 'Kids Special',
    subtitle: 'For our youngest guests',
    isActive: false,
    categories: [
      { categoryId: 'cat-10' },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

const Menus: React.FC = () => {
  const [menus, setMenus]         = useState<MenuEntity[]>(DUMMY_MENUS);
  const [categories]              = useState<Category[]>(DUMMY_CATEGORIES);

  // TODO: Replace with real API calls
  // const fetchData = async () => {
  //   const [menusRes, catsRes] = await Promise.all([
  //     MenuService.getMenus(),
  //     CategoriesService.getCategories(),
  //   ]);
  //   if (menusRes.success) setMenus(menusRes.data ?? []);
  //   if (catsRes.success) setCategories(catsRes.data ?? []);
  // };

  const handleRefresh = () => {
    // no-op until API is connected — state mutations happen inside the view
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Title level={2} style={{ margin: 0 }}>
        Menu Management
      </Title>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <MenuManagementView
          menus={menus}
          categories={categories}
          loading={false}
          onMenusChange={setMenus}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default Menus;
