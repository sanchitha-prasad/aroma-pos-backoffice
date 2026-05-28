import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import OrderView from '../features/orders/components/OrderView';
import { Order } from '../shared/types';
import { orderService } from '../features/orders/api/order.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';
import { Modal } from 'antd';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const[popup, contextHolder] = Modal.useModal();
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders();
            if(data.success){
                setOrders(data.data ?? []);
            }else{
                showErrorMessage(popup, data.message, "Tax Fetch Failed");
            }
            
        } catch (error) {
            message.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return(
        <>
        {contextHolder}
        <OrderView 
            orders={orders}
        />
        </>
    );
}
export default Orders;