import { MenuItem, Employee, ModifierGroup, Category, Device, Permission, Role, Tax, Branch, Order } from '../types';

export const MOCK_TAXES: Tax[] = [
    { id: 't1', name: 'Sales Tax', percentage: 8.00, isActive: true, type: 'Percentage' },
    { id: 't2', name: 'Liquor Tax', percentage: 15.00, isActive: true, type: 'Percentage' },
    { id: 't3', name: 'Bottle Deposit', percentage: 0.05, isActive: true, type: 'Fixed' }
];

export const MOCK_BRANCHES: Branch[] = [
    { 
        id: 'b1', 
        name: 'New Branch 1', 
        code: 'BR001', 
        phoneNumber: '+94123456789', 
        email: 'branch1@aromapos.com', 
        isActive: true,
        status: 'Active',
        address: {
            addressLine1: "123 Main Street",
            addressLine2: "Suite 5",
            city: "Colombo",
            state: "Western",
            country: "Sri Lanka",
            longitude: "79.8612",
            latitude: "6.9271"
        },
        configuration: {
            maxFloors: 3,
            operationStartOnUtc: "2025-09-15T04:39:20Z",
            operationEndOnUtc: "2025-09-15T18:00:00Z"
        }
    },
    { 
        id: 'b2', 
        name: 'Downtown Express', 
        code: 'BR002', 
        phoneNumber: '+15550009999', 
        email: 'downtown@aromapos.com', 
        isActive: true,
        status: 'Active',
        address: {
            addressLine1: "456 5th Ave",
            city: "New York",
            state: "NY",
            country: "USA",
            longitude: "-74.0060",
            latitude: "40.7128"
        },
        configuration: {
            maxFloors: 1,
            operationStartOnUtc: "2025-09-15T10:00:00Z",
            operationEndOnUtc: "2025-09-15T22:00:00Z"
        }
    }
];

export const MOCK_ORDERS: Order[] = [
    {
        "id": "88e8608d-5a2c-4d18-a16c-c086661f47e6",
        "orderNumber": 1001,
        "tableId": "Table-5",
        "splitedType": 1,
        "orderType": 1,
        "tickets": [
            {
                "id": "8a453c10-ad12-4bb0-9a6b-c8b2fdb1638f",
                "ticketNumber": 1,
                "discount": 0.00,
                "isDiscountPercentage": false,
                "serviceCharge": 0.00,
                "isServiceChargePercentage": false,
                "paymentStatus": 3,
                "payments": [
                    {
                        "id": "dcf0ada0-83cc-46c8-ae0a-7c23398b60db",
                        "amount": 50.00,
                        "paymentType": 0
                    }
                ],
                "items": [
                    {
                        "id": "482d027f-07df-4c16-b2c0-0d1f6ae08557",
                        "itemId": "0b003157-50f9-4060-af49-a3115e00a725",
                        "name": "Classic Cheeseburger",
                        "quantity": 1.00,
                        "portion": 1.000,
                        "price": 15.00,
                        "discount": 0.00,
                        "isDiscountPercentage": false,
                        "modifiers": [
                            {
                                "id": "37c5414a-16c3-45a4-b94a-98b81413d8d3",
                                "name": "Extra Cheese",
                                "description": "Cheddar",
                                "price": 1.50,
                                "isActive": true,
                                "quantity": 1.00
                            },
                            {
                                "id": "e2cf3bf7-5fa0-49a7-809d-933cea4f8af4",
                                "name": "No Onions",
                                "description": "",
                                "price": 0.00,
                                "isActive": true,
                                "quantity": 1.00
                            }
                        ],
                        "variant": {
                            "variantId": "92d273d5-7f5e-476a-8b54-b818094d64da",
                            "variantName": "Double Patty",
                            "price": 15.00,
                            "status": "Available"
                        },
                        "taxes": [
                            {
                                "id": "27bf2ee9-4584-4cd9-a623-1ab78871f157",
                                "name": "Sales Tax",
                                "percentage": 8.00,
                                "isActive": true
                            }
                        ]
                    },
                    {
                        "id": "42ab6791-f113-4d70-b85b-99021c3f2379",
                        "itemId": "0b003157-50f9-4060-af49-a3115e00a725",
                        "name": "Craft Cola",
                        "quantity": 2.00,
                        "portion": 1.000,
                        "price": 3.50,
                        "discount": 0.00,
                        "isDiscountPercentage": false,
                        "modifiers": [],
                        "taxes": []
                    }
                ]
            }
        ]
    }
];

export const MOCK_CATEGORIES: Category[] = [
  { 
      id: 'cat1', 
      name: 'Burgers', 
      description: 'Juicy flame-grilled burgers',
      isActive: true,
      KitichenDisplayIds: ['d1', 'd2'], // Assigned to Main Kitchen & Grill KDS
      PrinterIds: ['d5'], // Assigned to Expo Printer
      taxIds: ['t1']
  },
  { 
      id: 'cat2', 
      name: 'Pizza', 
      description: 'Wood-fired pizzas',
      isActive: true,
      KitichenDisplayIds: ['d3'], // Pizza Station KDS
      PrinterIds: ['d5'],
      taxIds: ['t1']
  },
  { 
      id: 'cat3', 
      name: 'Drinks', 
      description: 'Cold beverages and cocktails',
      isActive: true,
      KitichenDisplayIds: [],
      PrinterIds: ['d4'], // Bar Printer
      taxIds: ['t1', 't3']
  },
  { 
      id: 'cat4', 
      name: 'Appetizers', 
      description: 'Starters and shareables',
      isActive: true,
      KitichenDisplayIds: ['d1'],
      PrinterIds: ['d5'],
      taxIds: ['t1']
  },
];

export const MOCK_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'mg1',
    name: 'Burger Sides',
    minSelectCount: 1,
    maxSelectCount: 1,
    isActive: true,
    modifierItems: [
      { modifierId: 'm1', modifierName: 'Fries', price: 0, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm2', modifierName: 'Onion Rings', price: 1.50, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm3', modifierName: 'Side Salad', price: 0, quantity: 0, minQuantity: 0, maxQuantity: 1 },
    ]
  },
  {
    id: 'mg2',
    name: 'Meat Temperature',
    minSelectCount: 1,
    maxSelectCount: 1,
    isActive: true,
    modifierItems: [
      { modifierId: 'm4', modifierName: 'Rare', price: 0, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm5', modifierName: 'Medium', price: 0, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm6', modifierName: 'Well Done', price: 0, quantity: 0, minQuantity: 0, maxQuantity: 1 },
    ]
  },
  {
    id: 'mg3',
    name: 'Pizza Toppings',
    minSelectCount: 0,
    maxSelectCount: 5,
    isActive: true,
    modifierItems: [
      { modifierId: 'm7', modifierName: 'Extra Cheese', price: 2.00, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm8', modifierName: 'Pepperoni', price: 1.50, quantity: 0, minQuantity: 0, maxQuantity: 1 },
      { modifierId: 'm9', modifierName: 'Mushrooms', price: 1.00, quantity: 0, minQuantity: 0, maxQuantity: 1 },
    ]
  }
];

export const MOCK_DEVICES: Device[] = [
  { 
    id: 'd1', 
    name: 'Main Kitchen KDS', 
    type: { id: 'dt1', name: 'KDS' },
    protocol: { id: 'dp1', name: 'TCP/IP' },
    location: 'Kitchen - Hot Line', 
    status: 'Online', 
    ipAddress: '192.168.1.101', 
    port: 8080 
  },
  { 
    id: 'd2', 
    name: 'Grill Station KDS', 
    type: { id: 'dt1', name: 'KDS' },
    protocol: { id: 'dp1', name: 'TCP/IP' },
    location: 'Kitchen - Grill', 
    status: 'Online', 
    ipAddress: '192.168.1.102', 
    port: 8080 
  },
  { 
    id: 'd3', 
    name: 'Pizza Station KDS', 
    type: { id: 'dt1', name: 'KDS' },
    protocol: { id: 'dp1', name: 'TCP/IP' },
    location: 'Kitchen - Pizza Oven', 
    status: 'Offline', 
    ipAddress: '192.168.1.103', 
    port: 8080 
  },
  { 
    id: 'd4', 
    name: 'Bar Printer', 
    type: { id: 'dt2', name: 'Printer' },
    protocol: { id: 'dp2', name: 'ESC/POS' },
    location: 'Bar Area', 
    status: 'Online', 
    ipAddress: '192.168.1.201', 
    port: 9100,
    serialNumber: 'EPSON-123456'
  },
  { 
    id: 'd5', 
    name: 'Expo Printer', 
    type: { id: 'dt2', name: 'Printer' },
    protocol: { id: 'dp2', name: 'ESC/POS' },
    location: 'Expo Line', 
    status: 'Online', 
    ipAddress: '192.168.1.202', 
    port: 9100 
  },
  { 
    id: 'd6', 
    name: 'Receipt Printer', 
    type: { id: 'dt2', name: 'Printer' },
    protocol: { id: 'dp2', name: 'ESC/POS' },
    location: 'Cashier 1', 
    status: 'Online', 
    ipAddress: '192.168.1.203', 
    port: 9100 
  },
  { 
    id: 'd7', 
    name: 'Main POS Terminal', 
    type: { id: 'dt3', name: 'POS' },
    protocol: { id: 'dp3', name: 'None' },
    location: 'Front Counter', 
    status: 'Online', 
    ipAddress: '192.168.1.50', 
    serialNumber: 'POS-X99-001'
  },
  { 
    id: 'd8', 
    name: 'Expo Screen', 
    type: { id: 'dt4', name: 'Expeditor' },
    protocol: { id: 'dp1', name: 'TCP/IP' },
    location: 'Expo Line', 
    status: 'Online', 
    ipAddress: '192.168.1.110', 
    port: 3000
  },
  { 
    id: 'd9', 
    name: 'Bar PAX Terminal', 
    type: { id: 'dt5', name: 'PAX' },
    protocol: { id: 'dp1', name: 'TCP/IP' },
    location: 'Bar Counter', 
    status: 'Online', 
    ipAddress: '192.168.1.60', 
    port: 10009,
    serialNumber: 'PAX-A920-001'
  },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Cheeseburger',
    categoryId: 'cat1',
    status: 'Available',
    description: 'Angus beef patty with cheddar, lettuce, tomato, and house sauce.',
    variants: [
        { variantId: 'v1', variantName: 'Standard', price: 12.99, status: 'Available' },
        { variantId: 'v2', variantName: 'Double Patty', price: 16.99, status: 'Available' }
    ],
    modifierGroupIds: ['mg1', 'mg2']
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    categoryId: 'cat2',
    status: 'Available',
    description: 'San Marzano tomato sauce, fresh mozzarella, basil.',
    variants: [
        { variantId: 'v3', variantName: 'Small (10")', price: 14.00, status: 'Available' },
        { variantId: 'v4', variantName: 'Large (14")', price: 18.00, status: 'Available' },
    ],
    modifierGroupIds: ['mg3']
  },
  {
    id: '3',
    name: 'Craft Cola',
    categoryId: 'cat3',
    status: 'Available',
    description: 'Artisanal cane sugar cola.',
    variants: [
        { variantId: 'v5', variantName: 'Regular', price: 3.50, status: 'Available' }
    ],
    modifierGroupIds: []
  },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'John Doe', email: 'john@restaurant.com', role: 'Admin', status: 'Active', loginNumber: '1001', password: 'password123', branchId: 'b1' },
  { id: '2', name: 'Jane Smith', email: 'jane@restaurant.com', role: 'Manager', status: 'Active', loginNumber: '2001', password: 'password123', branchId: 'b1' },
  { id: '3', name: 'Mike Cook', email: 'mike@restaurant.com', role: 'Kitchen', status: 'Active', loginNumber: '3001', password: 'password123', branchId: 'b2' },
];

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
    
    // Specific Report Permissions
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

    // Configuration Tabs
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
        'manage_variants','view_variants',
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