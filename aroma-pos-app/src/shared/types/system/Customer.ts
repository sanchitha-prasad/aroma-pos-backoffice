import { CustomerStatus } from '../../enums';

export interface Customer {
    id: string;
    code: string;           
    firstName: string;     
    lastName?: string;      
    email?: string;         
    phoneNumber: string;    
    status: CustomerStatus; 
    createdOnUtc: string;   
    updatedOnUtc?: string;  
}

export interface CreateCustomerRequest{
    firstName: string;     
    lastName?: string;      
    email?: string;         
    phoneNumber: string;    
}

export interface UpdateCustomerRequest{
    firstName: string;     
    lastName?: string;      
    email?: string;         
    phoneNumber: string;  
    status: CustomerStatus;  
}