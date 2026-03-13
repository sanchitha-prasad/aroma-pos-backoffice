import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import CustomersView from '../features/system/components/CustomersView';
import { CustomersService } from '../features/system/api/customers.service';
import { Customer } from '../shared/types/system/Customer';
import { CustomerStatus } from '../shared/enums';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../shared/types/system/Customer';
import { authService } from '../features/auth/api/auth.service';

// const mapCustomerStatus = (status: string): CustomerStatus =>{
//   switch (status){
//     case 'Active':
//       return CustomerStatus.Active;
//     case 'Inactive':
//       return CustomerStatus.Inactive;
//     case 'Blocked':
//       return CustomerStatus.Blocked;
//     case 'Default':
//       return CustomerStatus.Active;
//   }
// }

const mapCustomerStatus = (status: string | number): CustomerStatus =>{
  if(status === 1 || status === '1' || status === 'Active'){
    return CustomerStatus.Active;
  }
  if(status === 2 || status === '2' || status === 'Inactive'){
    return CustomerStatus.Inactive;
  }
  if(status === 3 || status === '3' || status === 'Blocked'){
    return CustomerStatus.Blocked;
  }
  return CustomerStatus.Active;
}

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    const currentUser = authService.getUserFromToken();
    const userRole = currentUser?.role || 'Server';

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const response = await CustomersService.getCustomers();
            if (response.success) {
                const mappedCustomers = (response.data || []).map((customer: any) => ({
                    ...customer,
                    status: mapCustomerStatus(customer.status)
                }));

                setCustomers(mappedCustomers);
            } else {
                message.error(response.message || 'Failed to load customers');
            }
            // if (response.success) {
            //     setCustomers(response.data || []);
            // } else {
            //     message.error(response.message || 'Failed to load customers');
            // }
        } catch (error) {
            console.error('Error loading customers:', error);
            message.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const handleSave = async (customer: Customer) => {
        try {
            if (customer.id) {
                const updatePayload: UpdateCustomerRequest = {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phoneNumber: customer.phoneNumber,
                    status: customer.status
                };

                const response = await CustomersService.updateCustomer(customer.id, updatePayload);

                if (response.success) {
                    message.success('Customer updated successfully');
                    await loadCustomers();
                } else {
                    message.error(response.message || 'Failed to update customer');
                }
            } else {
                const createPayload: CreateCustomerRequest = {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phoneNumber: customer.phoneNumber
                };

                const response = await CustomersService.createCustomer(createPayload);

                if (response.success) {
                    message.success('Customer created successfully');
                    await loadCustomers();
                } else {
                    message.error(response.message || 'Failed to create customer');
                }
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            message.error('Something went wrong while saving customer');
        }
    };

    // const handleStatusChange = async (id: string, newStatus: CustomerStatus) => {
    //     try {
    //       const customer = customers.find(c => c.id === id);

    //         if (!customer) {
    //             message.error('Customer not found');
    //             return;
    //         }

    //         const updatePayload: UpdateCustomerRequest = {
    //             firstName: customer.firstName,
    //             lastName: customer.lastName,
    //             email: customer.email,
    //             phoneNumber: customer.phoneNumber,
    //             status: newStatus
    //         };
    //         const response = await CustomersService.updateCustomer(id, updatePayload);

    //         if (response.success) {
    //             message.success('Customer status updated successfully');
    //             await loadCustomers();
    //         } else {
    //             message.error(response.message || 'Failed to update customer status');
    //         }
    //     } catch (error) {
    //         console.error('Error updating customer status:', error);
    //         message.error('Something went wrong while updating customer status');
    //     }
    // };

    const handleStatusChange = async (id: string, newStatus: CustomerStatus) => {
    try {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const updatePayload: UpdateCustomerRequest = {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            status: Number(newStatus) as CustomerStatus  // Sending number to backend
        };

        const response = await CustomersService.updateCustomer(id, updatePayload);

        if (response.success) {
            message.success('Customer status updated successfully');
            await loadCustomers(); // This will trigger the mapping logic in loadCustomers
        } else {
            message.error(response.message || 'Failed to update customer status');
        }
    } catch (error) {
        message.error('Error updating status');
    }
};

    return (
        <CustomersView
            customers={customers}
            loading={loading}
            userRole={userRole}
            onSave={handleSave}
            onStatusChange={handleStatusChange}
        />
    );
};

export default Customers;