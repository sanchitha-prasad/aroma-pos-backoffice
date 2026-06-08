import { ServiceResponse } from "../../types/serviceResponse";

export const handleRequest = async <T>(request: Promise<any>): Promise<ServiceResponse<T>> => {
    try {
        const response = await request;
        return {
            success: true,
            data: response,
            message: "Operation successful"
        };
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred.";
        
        return {
            success: false,
            data: null,
            message: errorMessage
        };
    }
};