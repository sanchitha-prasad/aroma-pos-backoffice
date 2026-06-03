import React from 'react';
import CustomersView from '../features/system/components/CustomersView';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../features/system/hooks/useCustomers';
import { authService } from '../features/auth/api/auth.service';
import type { Customer } from '../shared/types/system/Customer';
import type { CustomerStatus } from '../shared/enums';

const Customers: React.FC = () => {
    const { data: customers = [], isLoading } = useCustomers();
    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    const userRole = authService.getCurrentUser()?.role || 'Manager';

    const handleSave = async (customer: Customer) => {
        if (customer.id) {
            await updateCustomer.mutateAsync({
                id: customer.id,
                data: {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phoneNumber: customer.phoneNumber,
                    status: Number(customer.status) as CustomerStatus,
                },
            });
        } else {
            await createCustomer.mutateAsync({
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phoneNumber: customer.phoneNumber,
            });
        }
    };

    const handleStatusChange = async (id: string, newStatus: CustomerStatus) => {
        const customer = customers.find((c) => c.id === id);
        if (!customer) return;
        await updateCustomer.mutateAsync({
            id,
            data: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phoneNumber: customer.phoneNumber,
                status: Number(newStatus) as CustomerStatus,
            },
        });
    };

    return (
        <CustomersView
            customers={customers}
            loading={isLoading}
            userRole={userRole}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
        />
    );
};

export default Customers;
