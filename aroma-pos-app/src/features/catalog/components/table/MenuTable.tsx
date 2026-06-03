import React, { useMemo, useState } from 'react';
import { Input, Select, Skeleton } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { RichTable } from '@/src/shared/components/rich-table';
import { buildMenuColumns } from './columns';
import type { MenuItem, Category, ModifierGroup, Device } from '@/src/shared/types';

const { Option } = Select;

const SKELETON_DATA = Array.from({ length: 8 }, (_, i) => ({ id: `sk-${i}` }) as unknown as MenuItem);

const SKELETON_COLUMNS: ColumnsType<MenuItem> = [
    { key: 'name',      width: 220, render: () => <Skeleton.Input active size="small" style={{ width: 140 }} /> },
    { key: 'category',  width: 140, render: () => <Skeleton.Input active size="small" style={{ width: 90 }} /> },
    { key: 'price',     width: 140, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'variants',  width: 160, render: () => <Skeleton.Input active size="small" style={{ width: 110 }} /> },
    { key: 'modifiers', width: 180, render: () => <Skeleton.Input active size="small" style={{ width: 120 }} /> },
    { key: 'kds',       width: 130, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'printers',  width: 130, render: () => <Skeleton.Input active size="small" style={{ width: 80 }} /> },
    { key: 'status',    width: 110, render: () => <Skeleton.Input active size="small" style={{ width: 60 }} /> },
    { key: 'actions',   width: 90,  render: () => <Skeleton.Button active size="small" style={{ width: 56 }} /> },
];

const QUICK_FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
];

interface MenuTableProps {
    items: MenuItem[];
    categories: Category[];
    modifierGroups: ModifierGroup[];
    devices: Device[];
    isLoading: boolean;
    onEdit: (item: MenuItem) => void;
    onDelete: (id: string) => void;
    toolbarRight?: React.ReactNode;
}

const MenuTable: React.FC<MenuTableProps> = ({
    items, categories, modifierGroups, devices,
    isLoading, onEdit, onDelete, toolbarRight,
}) => {
    const [search, setSearch]       = useState('');
    const [catFilter, setCatFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const [pageSize, setPageSize]         = useState(10);

    const columns = useMemo(
        () => buildMenuColumns({ categories, modifierGroups, devices, onEdit, onDelete }),
        [categories, modifierGroups, devices, onEdit, onDelete],
    );

    const filtered = useMemo(() => {
        return (items ?? []).filter(item => {
            if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (catFilter && item.categoryId !== catFilter) return false;
            if (statusFilter === 'active'   && !item.isActive)  return false;
            if (statusFilter === 'inactive' &&  item.isActive)  return false;
            return true;
        });
    }, [items, search, catFilter, statusFilter]);

    const quickFiltersWithCounts = useMemo(() => {
        const all      = (items ?? []).length;
        const active   = (items ?? []).filter(i => i.isActive).length;
        const inactive = all - active;
        return [
            { key: 'all',      label: 'All',      count: all },
            { key: 'active',   label: 'Active',   count: active },
            { key: 'inactive', label: 'Inactive', count: inactive },
        ];
    }, [items]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleStatusFilter = (key: string) => {
        setStatusFilter(key);
        setCurrentPage(1);
    };

    const filterBar = (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Input
                placeholder="Search items…"
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ maxWidth: 260 }}
                allowClear
            />
            <Select
                placeholder="All categories"
                allowClear
                style={{ width: 200 }}
                value={catFilter}
                onChange={val => { setCatFilter(val ?? null); setCurrentPage(1); }}
            >
                {(categories ?? []).map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                ))}
            </Select>
        </div>
    );

    const shared = {
        quickFilters: quickFiltersWithCounts,
        activeFilterKey: statusFilter,
        onFilterChange: handleStatusFilter,
        filterBar,
        toolbarRight,
        totalLabel: 'items' as const,
        scrollY: 'calc(100vh - 340px)',
    };

    if (isLoading) {
        return (
            <RichTable<MenuItem>
                data={SKELETON_DATA}
                columns={SKELETON_COLUMNS}
                rowKey="id"
                currentPage={1} pageSize={8} totalItems={0}
                onPageChange={() => {}} onPageSizeChange={() => {}}
                {...shared}
            />
        );
    }

    return (
        <RichTable<MenuItem>
            data={paginatedData}
            columns={columns}
            rowKey="id"
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={s => { setPageSize(s); setCurrentPage(1); }}
            {...shared}
        />
    );
};

export default MenuTable;
