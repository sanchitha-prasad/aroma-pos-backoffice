import { Permission, Role } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
    // General
    { key: 'BackOffice:dashboard:view', label: 'View Dashboard', group: 'General' },

    // Menu
    { key: 'BackOffice:menu:view',    label: 'View Menu',        group: 'Menu' },
    { key: 'BackOffice:menu:get',     label: 'Get Menu Item',    group: 'Menu' },
    { key: 'BackOffice:menu:getall',  label: 'List Menu Items',  group: 'Menu' },
    { key: 'BackOffice:menu:create',  label: 'Create Menu Item', group: 'Menu' },
    { key: 'BackOffice:menu:update',  label: 'Update Menu Item', group: 'Menu' },
    { key: 'BackOffice:menu:delete',  label: 'Delete Menu Item', group: 'Menu' },
    { key: 'BackOffice:menu:manage',  label: 'Manage Menu',      group: 'Menu' },

    // Modifiers
    { key: 'BackOffice:modifiers:get',    label: 'Get Modifier',    group: 'Modifiers' },
    { key: 'BackOffice:modifiers:getall', label: 'List Modifiers',  group: 'Modifiers' },
    { key: 'BackOffice:modifiers:create', label: 'Create Modifier', group: 'Modifiers' },
    { key: 'BackOffice:modifiers:update', label: 'Update Modifier', group: 'Modifiers' },
    { key: 'BackOffice:modifiers:delete', label: 'Delete Modifier', group: 'Modifiers' },

    // Variants
    { key: 'BackOffice:variants:get',    label: 'Get Variant',    group: 'Variants' },
    { key: 'BackOffice:variants:getall', label: 'List Variants',  group: 'Variants' },
    { key: 'BackOffice:variants:create', label: 'Create Variant', group: 'Variants' },
    { key: 'BackOffice:variants:update', label: 'Update Variant', group: 'Variants' },
    { key: 'BackOffice:variants:delete', label: 'Delete Variant', group: 'Variants' },

    // Categories
    { key: 'BackOffice:categories:get',         label: 'Get Category',        group: 'Categories' },
    { key: 'BackOffice:categories:getall',       label: 'List Categories',     group: 'Categories' },
    { key: 'BackOffice:categories:getall_items', label: 'List Category Items', group: 'Categories' },
    { key: 'BackOffice:categories:create',       label: 'Create Category',     group: 'Categories' },
    { key: 'BackOffice:categories:update',       label: 'Update Category',     group: 'Categories' },
    { key: 'BackOffice:categories:delete',       label: 'Delete Category',     group: 'Categories' },

    // Taxes
    { key: 'BackOffice:taxes:get',    label: 'Get Tax',    group: 'Taxes' },
    { key: 'BackOffice:taxes:getall', label: 'List Taxes', group: 'Taxes' },
    { key: 'BackOffice:taxes:create', label: 'Create Tax', group: 'Taxes' },
    { key: 'BackOffice:taxes:update', label: 'Update Tax', group: 'Taxes' },
    { key: 'BackOffice:taxes:delete', label: 'Delete Tax', group: 'Taxes' },

    // Devices
    { key: 'BackOffice:devices:get',    label: 'Get Device',    group: 'Devices' },
    { key: 'BackOffice:devices:getall', label: 'List Devices',  group: 'Devices' },
    { key: 'BackOffice:devices:create', label: 'Create Device', group: 'Devices' },
    { key: 'BackOffice:devices:update', label: 'Update Device', group: 'Devices' },
    { key: 'BackOffice:devices:delete', label: 'Delete Device', group: 'Devices' },

    // Employees
    { key: 'BackOffice:employees:get',    label: 'Get Employee',    group: 'Employees' },
    { key: 'BackOffice:employees:getall', label: 'List Employees',  group: 'Employees' },
    { key: 'BackOffice:employees:create', label: 'Create Employee', group: 'Employees' },
    { key: 'BackOffice:employees:update', label: 'Update Employee', group: 'Employees' },
    { key: 'BackOffice:employees:delete', label: 'Delete Employee', group: 'Employees' },

    // Branches
    { key: 'BackOffice:branches:get',    label: 'Get Branch',    group: 'Branches' },
    { key: 'BackOffice:branches:getall', label: 'List Branches', group: 'Branches' },
    { key: 'BackOffice:branches:create', label: 'Create Branch', group: 'Branches' },
    { key: 'BackOffice:branches:update', label: 'Update Branch', group: 'Branches' },
    { key: 'BackOffice:branches:delete', label: 'Delete Branch', group: 'Branches' },

    // Orders
    { key: 'BackOffice:orders:get',               label: 'Get Order',            group: 'Orders' },
    { key: 'BackOffice:orders:getall',             label: 'List Orders',          group: 'Orders' },
    { key: 'BackOffice:orders:create',             label: 'Create Order',         group: 'Orders' },
    { key: 'BackOffice:orders:update',             label: 'Update Order',         group: 'Orders' },
    { key: 'BackOffice:orders:delete',             label: 'Delete Order',         group: 'Orders' },
    { key: 'BackOffice:orders:get_ordered_tickets', label: 'Get Ordered Tickets', group: 'Orders' },

    // Activity
    { key: 'BackOffice:activity:get',    label: 'Get Activity',    group: 'Activity' },
    { key: 'BackOffice:activity:getall', label: 'List Activities', group: 'Activity' },
    { key: 'BackOffice:activity:create', label: 'Create Activity', group: 'Activity' },
    { key: 'BackOffice:activity:update', label: 'Update Activity', group: 'Activity' },
    { key: 'BackOffice:activity:delete', label: 'Delete Activity', group: 'Activity' },

    // Reports (access)
    { key: 'BackOffice:reports:view',          label: 'View Reports Page',   group: 'Reports' },
    { key: 'BackOffice:reports:sales_summary', label: 'Sales Summary Access', group: 'Reports' },

    // Configuration
    { key: 'BackOffice:config:view',     label: 'Access Configuration',  group: 'Configuration' },
    { key: 'BackOffice:config:business', label: 'Business Profile',       group: 'Configuration' },
    { key: 'BackOffice:config:payments', label: 'Payments Settings',      group: 'Configuration' },
    { key: 'BackOffice:config:kds',      label: 'KDS Settings',           group: 'Configuration' },
    { key: 'BackOffice:config:alerts',   label: 'Alerts Settings',        group: 'Configuration' },
    { key: 'BackOffice:config:shifts',   label: 'Shifts Settings',        group: 'Configuration' },
    { key: 'BackOffice:config:reports',  label: 'Reports Settings',       group: 'Configuration' },

    // Reporting — Sales
    { key: 'BackOffice:report_sales:summary',  label: 'Sales Summary',     group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:hourly',   label: 'Hourly Sales',      group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:tips',     label: 'Tip Report',        group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:item',     label: 'Sales by Item',     group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:category', label: 'Sales by Category', group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:shift',    label: 'Sales by Shift',    group: 'Reporting - Sales' },
    { key: 'BackOffice:report_sales:orders',   label: 'Order Summary',     group: 'Reporting - Sales' },

    // Reporting — Employee
    { key: 'BackOffice:report_employee:attendance',  label: 'Attendance Report',   group: 'Reporting - Employee' },
    { key: 'BackOffice:report_employee:shifts',      label: 'Shift Detail',        group: 'Reporting - Employee' },
    { key: 'BackOffice:report_employee:performance', label: 'Sales by Employee',   group: 'Reporting - Employee' },

    // Reporting — Payments
    { key: 'BackOffice:report_payment:methods', label: 'Payment Methods', group: 'Reporting - Payments' },
    { key: 'BackOffice:report_payment:batch',   label: 'Batch Report',    group: 'Reporting - Payments' },
    { key: 'BackOffice:report_payment:summary', label: 'Batch Summary',   group: 'Reporting - Payments' },

    // Reporting — Audit
    { key: 'BackOffice:report_audit:shift',  label: 'Shift Audit',          group: 'Reporting - Audit' },
    { key: 'BackOffice:report_audit:drawer', label: 'Drawer Report',        group: 'Reporting - Audit' },
    { key: 'BackOffice:report_audit:logs',   label: 'Sensitive Actions Log', group: 'Reporting - Audit' },
];

const ALL_KEYS = ALL_PERMISSIONS.map(p => p.key);

// Only SuperAdmin, Admin, and Manager use the back-office.
// Cashier, Waiter, and Kitchen are POS-only roles with no back-office access.
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
    SuperAdmin: ALL_KEYS,
    Admin:      ALL_KEYS.filter(k => k !== 'BackOffice:activity:delete'),
    Manager:    ALL_KEYS.filter(k => k !== 'BackOffice:activity:delete'),
    Cashier:    [],
    Waiter:     [],
    Kitchen:    [],
};
