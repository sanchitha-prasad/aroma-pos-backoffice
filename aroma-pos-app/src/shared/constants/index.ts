import { Permission, Role } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
    { key: 'view_dashboard', label: 'View Dashboard', group: 'General' },
    { key: 'view_menu', label: 'View Menu Items', group: 'Menu' },
    { key: 'manage_menu', label: 'Manage Menu Items', group: 'Menu', description: 'Create, Edit, Delete' },
    { key: 'view_modifiers', label: 'View Modifiers', group: 'Menu' },
    { key: 'manage_modifiers', label: 'Manage Modifiers', group: 'Menu' },
    { key: 'view_categories', label: 'View Categories', group: 'Menu' },
    { key: 'manage_categories', label: 'Manage Categories', group: 'Menu' },
    { key: 'view_variants', label: 'View Variants', group: 'Menu' },
    { key: 'manage_variants', label: 'Manage Variants', group: 'Menu' },
    { key: 'view_taxes', label: 'View Taxes', group: 'Menu' },
    { key: 'manage_taxes', label: 'Manage Taxes', group: 'Menu' },
    { key: 'view_devices', label: 'View Devices', group: 'System' },
    { key: 'manage_devices', label: 'Manage Devices', group: 'System' },
    { key: 'view_employees', label: 'View Employees', group: 'System' },
    { key: 'manage_employees', label: 'Manage Employees', group: 'System' },
    { key: 'view_customers', label: 'View Customers', group: 'System' },
    { key: 'manage_customers', label: 'Manage Customers', group: 'System' },
    { key: 'view_branches', label: 'View Branches', group: 'System' },
    { key: 'manage_branches', label: 'Manage Branches', group: 'System' },
    { key: 'view_orders', label: 'View Orders', group: 'Sales' },
    { key: 'manage_orders', label: 'Manage Orders', group: 'Sales' },
    { key: 'view_activity', label: 'View Activity Log', group: 'System' },
    { key: 'view_reports', label: 'View Reports Page', group: 'Reporting' },
    { key: 'manage_roles', label: 'Manage Roles & Permissions', group: 'System' },

    { key: 'rpt_sales_summary', label: 'Report: Sales Summary', group: 'Reporting - Sales' },
    { key: 'rpt_sales_hourly', label: 'Report: Hourly Sales', group: 'Reporting - Sales' },
    { key: 'rpt_sales_tips', label: 'Report: Tip Report', group: 'Reporting - Sales' },
    { key: 'rpt_sales_item', label: 'Report: Sales by Item', group: 'Reporting - Sales' },
    { key: 'rpt_sales_category', label: 'Report: Sales by Category', group: 'Reporting - Sales' },
    { key: 'rpt_sales_shift', label: 'Report: Sales by Shift', group: 'Reporting - Sales' },
    { key: 'rpt_sales_orders', label: 'Report: Order Summary', group: 'Reporting - Sales' },

    { key: 'rpt_emp_attendance', label: 'Report: Attendance', group: 'Reporting - Employee' },
    { key: 'rpt_emp_shifts', label: 'Report: Shift Detail', group: 'Reporting - Employee' },
    { key: 'rpt_emp_performance', label: 'Report: Sales by Employee', group: 'Reporting - Employee' },

    { key: 'rpt_pay_methods', label: 'Report: Payment Methods', group: 'Reporting - Payments' },
    { key: 'rpt_pay_batch', label: 'Report: Batch Report', group: 'Reporting - Payments' },
    { key: 'rpt_pay_summary', label: 'Report: Batch Summary', group: 'Reporting - Payments' },

    { key: 'rpt_audit_shift', label: 'Report: Shift Audit', group: 'Reporting - Audit' },
    { key: 'rpt_audit_drawer', label: 'Report: Drawer Report', group: 'Reporting - Audit' },
    { key: 'rpt_audit_logs', label: 'Report: Sensitive Actions Log', group: 'Reporting - Audit' },

    { key: 'config_view', label: 'Access Configuration Page', group: 'Configuration' },
    { key: 'config_business', label: 'Config: Business Profile', group: 'Configuration' },
    { key: 'config_payments', label: 'Config: Payments', group: 'Configuration' },
    { key: 'config_kds', label: 'Config: KDS', group: 'Configuration' },
    { key: 'config_alerts', label: 'Config: Alerts', group: 'Configuration' },
    { key: 'config_loyalty', label: 'Config: Loyalty', group: 'Configuration' },
    { key: 'config_giftcards', label: 'Config: Gift Cards', group: 'Configuration' },
    { key: 'config_reservations', label: 'Config: Reservations', group: 'Configuration' },
    { key: 'config_reports', label: 'Config: Reports Settings', group: 'Configuration' },
    { key: 'config_qr', label: 'Config: QR Ordering', group: 'Configuration' },
    { key: 'config_multistore', label: 'Config: Multi-Store', group: 'Configuration' },
    { key: 'config_shifts', label: 'Config: Shifts', group: 'Configuration' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
    'Admin': ALL_PERMISSIONS.map(p => p.key),
    'Manager': [
        'view_dashboard', 'view_menu', 'manage_menu', 'view_modifiers', 'manage_modifiers',
        'manage_variants', 'view_variants',
        'view_categories', 'manage_categories', 'view_taxes', 'manage_taxes',
        'view_devices', 'manage_devices', 'view_customers', 'manage_customers',
        'view_employees', 'manage_employees', 'view_branches', 'view_orders', 'manage_orders',
        'view_activity', 'view_reports',
        'config_view', 'config_business', 'config_payments', 'config_kds', 'config_alerts', 'config_shifts', 'config_reports',
        'rpt_sales_summary', 'rpt_sales_hourly', 'rpt_sales_tips', 'rpt_sales_item', 'rpt_sales_category', 'rpt_sales_shift', 'rpt_sales_orders',
        'rpt_emp_attendance', 'rpt_emp_shifts', 'rpt_emp_performance',
        'rpt_pay_methods', 'rpt_pay_batch', 'rpt_pay_summary',
        'rpt_audit_shift', 'rpt_audit_drawer', 'rpt_audit_logs'
    ],
    'Server': [
        'view_dashboard', 'view_menu', 'config_shifts', 'view_reports', 'view_orders',
        'rpt_sales_summary', 'rpt_sales_tips', 'rpt_emp_attendance'
    ],
    'Kitchen': ['view_dashboard', 'view_menu']
};
