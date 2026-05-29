// Update the namespace below to match your project
// e.g. YourApp.Infrastructure.Data.Seeders
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace YourApp.Infrastructure.Data.Seeders;

public class IdentityRolePermissionSeeder
{
    private readonly RoleManager<IdentityRole> _roleManager;

    public IdentityRolePermissionSeeder(RoleManager<IdentityRole> roleManager)
    {
        _roleManager = roleManager;
    }

    // All module:operation pairs — each generates both BackOffice:{op} and POS:{op}
    private static readonly string[] AllOperations =
    {
        // Activity
        "activity:get", "activity:getall", "activity:create", "activity:update", "activity:delete",

        // Branch (single)
        "branch:get", "branch:getall", "branch:create", "branch:update", "branch:delete",

        // Branches (management)
        "branches:get", "branches:getall", "branches:create", "branches:update", "branches:delete",

        // Branch Items
        "branchitems:get", "branchitems:getall", "branchitems:update",

        // Branch Modifier Groups
        "branchmodifiergroups:update_availability",

        // Branch Modifiers
        "branchmodifiers:update_availability",

        // Branch Variants
        "branchvariants:update_variant_availability",

        // Categories
        "categories:get", "categories:getall", "categories:getall_items",
        "categories:create", "categories:update", "categories:delete",

        // Clocking
        "clocking:clock_in", "clocking:clock_out", "clocking:end_break",
        "clocking:get_history", "clocking:get_last_clock_in", "clocking:getall_cashier_shifts", "clocking:start_break",

        // Config
        "config:alerts", "config:business", "config:kds",
        "config:payments", "config:reports", "config:shifts", "config:view",

        // Customers
        "customers:get", "customers:getall", "customers:create", "customers:update", "customers:delete",

        // Dashboard
        "dashboard:view",

        // Device (single)
        "device:get", "device:getall", "device:create", "device:update", "device:delete",

        // Device Protocol
        "deviceprotocol:get", "deviceprotocol:getall", "deviceprotocol:create",
        "deviceprotocol:update", "deviceprotocol:delete",

        // Devices
        "devices:get", "devices:getall", "devices:create", "devices:update", "devices:delete",

        // Device Type
        "devicetype:get", "devicetype:create", "devicetype:update", "devicetype:delete",

        // Drawer Shift
        "drawershift:getall", "drawershift:handover", "drawershift:start_drawer",
        "drawershift:end", "drawershift:cash_out", "drawershift:get_by_device", "drawershift:get_status",

        // Element Shape
        "elementshape:get", "elementshape:create", "elementshape:update", "elementshape:delete",

        // Element Types
        "elementtypes:get", "elementtypes:create", "elementtypes:update", "elementtypes:delete",

        // Employees
        "employees:get", "employees:getall", "employees:create", "employees:update", "employees:delete",

        // Floor Element
        "floorelement:get", "floorelement:getall", "floorelement:create",
        "floorelement:update", "floorelement:delete",

        // Floors
        "floors:get", "floors:getall", "floors:create", "floors:update", "floors:delete",

        // Gift Cards
        "giftcards:get", "giftcards:getall", "giftcards:create", "giftcards:update", "giftcards:delete",

        // Gift Vouchers
        "giftvouchers:get", "giftvouchers:getall", "giftvouchers:create", "giftvouchers:update",
        "giftvouchers:delete", "giftvouchers:delete_gift_voucher_book", "giftvouchers:import_gift_voucher_book",

        // Items
        "items:get", "items:getall", "items:create", "items:update", "items:delete",

        // KDS
        "kds:get_categories_by_device", "kds:getall_orders_by_device",
        "kds:update_item_status", "kds:update_order_status",

        // Menu
        "menu:view", "menu:get", "menu:getall", "menu:create", "menu:update", "menu:delete", "menu:manage",

        // Modifier Groups
        "modifiergroups:get", "modifiergroups:getall", "modifiergroups:create",
        "modifiergroups:update", "modifiergroups:delete",

        // Modifiers
        "modifiers:get", "modifiers:getall", "modifiers:create", "modifiers:update", "modifiers:delete",

        // Orders
        "orders:get", "orders:getall", "orders:create", "orders:update",
        "orders:delete", "orders:get_ordered_tickets",

        // Payments
        "payments:get", "payments:getall", "payments:create", "payments:update",
        "payments:refund", "payments:void",

        // Receipt
        "receipt:get", "receipt:getall", "receipt:create", "receipt:update", "receipt:delete",

        // Report – Audit
        "report_audit:shift", "report_audit:drawer", "report_audit:logs",

        // Report – Employee
        "report_employee:attendance", "report_employee:performance", "report_employee:shifts",

        // Report – Payment
        "report_payment:batch", "report_payment:methods", "report_payment:summary",

        // Report – Sales
        "report_sales:category", "report_sales:hourly", "report_sales:item",
        "report_sales:orders", "report_sales:shift", "report_sales:summary", "report_sales:tips",

        // Reports
        "reports:sales_summary", "reports:view",

        // Tags
        "tags:get", "tags:getall", "tags:create", "tags:update", "tags:delete",

        // Taxes
        "taxes:get", "taxes:getall", "taxes:create", "taxes:update", "taxes:delete",

        // Tenant Settings
        "tenantsettings:get", "tenantsettings:getall", "tenantsettings:create_or_update",

        // Tip Pools
        "tippools:get", "tippools:getall",
        "tippools:delete", "tippools:create_rule", "tippools:delete_rule", "tippools:update_rule",
        "tippools:calculate_distribution", "tippools:get_distribution_results",
        "tippools:get_payroll_export", "tippools:get_tip_in_tippool",
        "tippools:adjust_distribution", "tippools:update", "tippools:create",

        // Users
        "users:get", "users:getall", "users:register", "users:delete", "users:update",

        // Variants
        "variants:get", "variants:getall", "variants:create", "variants:update", "variants:delete",
    };

    // Restricted for TenantAdmin and Manager (same restrictions for both)
    private static readonly HashSet<string> AdminManagerRestricted = new()
    {
        "activity:delete",
        "devicetype:create", "devicetype:update", "devicetype:delete",
        "elementshape:create", "elementshape:update", "elementshape:delete",
        "elementtypes:create", "elementtypes:update", "elementtypes:delete",
    };

    // Restricted for Cashier
    private static readonly HashSet<string> CashierRestricted = new()
    {
        "activity:delete",
        "branch:create", "branch:update", "branch:delete",
        "branches:create", "branches:update", "branches:delete",
        "branchitems:update",
        "branchmodifiergroups:update_availability",
        "branchmodifiers:update_availability",
        "branchvariants:update_variant_availability",
        "categories:create", "categories:update", "categories:delete",
        "clocking:getall_cashier_shifts",
        "config:alerts", "config:business", "config:kds",
        "config:payments", "config:reports", "config:shifts", "config:view",
        "customers:delete",
        "device:getall", "device:create", "device:update", "device:delete",
        "deviceprotocol:get", "deviceprotocol:getall", "deviceprotocol:create",
        "deviceprotocol:update", "deviceprotocol:delete",
        "devices:delete",
        "devicetype:create", "devicetype:update", "devicetype:delete",
        "drawershift:getall", "drawershift:handover",
        "elementshape:create", "elementshape:update", "elementshape:delete",
        "elementtypes:create", "elementtypes:update", "elementtypes:delete",
        "employees:create", "employees:update", "employees:delete",
        "floorelement:delete",
        "floors:delete",
        "giftcards:delete",
        "giftvouchers:delete", "giftvouchers:delete_gift_voucher_book", "giftvouchers:import_gift_voucher_book",
        "items:create", "items:update", "items:delete",
        "menu:create", "menu:update", "menu:delete", "menu:manage",
        "modifiergroups:create", "modifiergroups:update", "modifiergroups:delete",
        "modifiers:create", "modifiers:update", "modifiers:delete",
        "orders:delete",
        "payments:refund", "payments:void",
        "receipt:update", "receipt:delete",
        "report_employee:attendance", "report_employee:performance",
        "report_payment:batch", "report_payment:methods", "report_payment:summary",
        "tags:update", "tags:delete",
        "taxes:create", "taxes:update", "taxes:delete",
        "tenantsettings:create_or_update",
        "tippools:delete", "tippools:create_rule", "tippools:delete_rule", "tippools:update_rule",
        "users:register", "users:update", "users:delete",
        "variants:create", "variants:update", "variants:delete",
    };

    // Additional restrictions for Waiter (combined with CashierRestricted)
    private static readonly HashSet<string> WaiterAdditionalRestricted = new()
    {
        "drawershift:start_drawer", "drawershift:end", "drawershift:cash_out",
        "drawershift:get_by_device", "drawershift:get_status",
        "floorelement:create", "floorelement:update",
        "report_sales:category", "report_sales:hourly", "report_sales:item",
        "report_sales:orders", "report_sales:shift", "report_sales:summary", "report_sales:tips",
        "reports:sales_summary", "reports:view",
        "tippools:calculate_distribution", "tippools:get_distribution_results",
        "tippools:get_payroll_export", "tippools:get_tip_in_tippool",
        "tippools:adjust_distribution", "tippools:update", "tippools:create",
    };

    // Kitchen only has access to this explicit set of operations
    private static readonly HashSet<string> KitchenAllowedOps = new()
    {
        "branchitems:get", "branchitems:getall",
        "categories:get", "categories:getall", "categories:getall_items",
        "clocking:clock_in", "clocking:clock_out", "clocking:end_break",
        "clocking:get_history", "clocking:get_last_clock_in", "clocking:start_break",
        "device:get",
        "devices:get",
        "devicetype:get",
        "elementtypes:get",
        "items:get", "items:getall",
        "kds:get_categories_by_device", "kds:getall_orders_by_device",
        "kds:update_item_status", "kds:update_order_status",
        "orders:get", "orders:getall", "orders:create", "orders:update", "orders:get_ordered_tickets",
        "tags:getall",
        "tenantsettings:get", "tenantsettings:getall",
    };

    private static HashSet<string> GetAllPermissions()
    {
        var perms = new HashSet<string>(AllOperations.Length * 2);
        foreach (var op in AllOperations)
        {
            perms.Add($"BackOffice:{op}");
            perms.Add($"POS:{op}");
        }
        return perms;
    }

    private static HashSet<string> BuildPermissions(IEnumerable<string> excludedOps)
    {
        var perms = GetAllPermissions();
        foreach (var op in excludedOps)
        {
            perms.Remove($"BackOffice:{op}");
            perms.Remove($"POS:{op}");
        }
        return perms;
    }

    private static HashSet<string> BuildKitchenPermissions()
    {
        var perms = new HashSet<string>(KitchenAllowedOps.Count * 2);
        foreach (var op in KitchenAllowedOps)
        {
            perms.Add($"BackOffice:{op}");
            perms.Add($"POS:{op}");
        }
        return perms;
    }

    public async Task SeedAsync()
    {
        var waiterRestricted = new HashSet<string>(CashierRestricted);
        waiterRestricted.UnionWith(WaiterAdditionalRestricted);

        var rolePermissions = new Dictionary<string, HashSet<string>>
        {
            { "SuperAdmin",   GetAllPermissions() },
            { "TenantAdmin",  BuildPermissions(AdminManagerRestricted) },
            { "Manager",      BuildPermissions(AdminManagerRestricted) },
            { "Cashier",      BuildPermissions(CashierRestricted) },
            { "Waiter",       BuildPermissions(waiterRestricted) },
            { "Kitchen",      BuildKitchenPermissions() },
        };

        foreach (var (roleName, permissions) in rolePermissions)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole(roleName));

            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            var existingClaims = await _roleManager.GetClaimsAsync(role);
            foreach (var claim in existingClaims)
                await _roleManager.RemoveClaimAsync(role, claim);

            foreach (var permission in permissions.OrderBy(p => p))
                await _roleManager.AddClaimAsync(role, new Claim("Permission", permission));
        }
    }
}
