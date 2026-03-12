import { CustomerStatus } from '../../enums';

export interface Customer {
    id: string;
    code: string;           
    firstName: string;     
    lastName?: string;      
    email?: string;         
    phoneNumber: string;    
    status: CustomerStatus; 
    isActive: boolean;      
    createdOnUtc: string;   
    updatedOnUtc?: string;  
}