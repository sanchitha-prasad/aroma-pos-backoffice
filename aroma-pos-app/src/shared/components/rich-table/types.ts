export interface QuickFilter {
    key: string;
    label: string;
    count?: number;
}

export interface RichTableProps<T> {
    data: T[];
    isLoading?: boolean;
    rowKey: keyof T | ((row: T) => string);

    // Quick filter pill tabs at top
    quickFilters?: QuickFilter[];
    activeFilterKey?: string;
    onFilterChange?: (key: string) => void;

    // Right side of the toolbar (e.g. view toggle)
    toolbarRight?: React.ReactNode;

    // Search + dropdown filter bar below tabs
    filterBar?: React.ReactNode;

    // Pagination
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    totalLabel?: string;

    // scroll height for table body
    scrollY?: string | number;
}
