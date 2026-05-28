import React, { useState, useEffect } from 'react';
import { message, Modal, Spin } from 'antd';
import CategoryView from '../features/catalog/components/CategoryView';
import { Category, Device, Tax } from '../shared/types';
import { CategoriesService } from '../features/catalog/api/categories.service';
import { DeviceSevices } from '../features/system/api/device.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';
import { TaxesService } from '../features/catalog/api/taxes.service';

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);

    const[popup, contextHolder] = Modal.useModal();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cats, devs, taxData] = await Promise.all([
                CategoriesService.getCategories(),
                DeviceSevices.getDevices(),
                TaxesService.getTaxes()
            ]);
            if(cats.success){
                setCategories(cats.data ?? []);
            }else{
                showErrorMessage(popup, cats.message, "Category Fetch Failed");
            }
            if(devs.success){
                setDevices(devs.data ?? []);
            }else{
                showErrorMessage(popup, devs.message, "Device Fetch Failed");
            }
            if(taxData.success){
                setTaxes(taxData.data ?? []);
            }else{
                showErrorMessage(popup, taxData.message, "Tax Fetch Failed");
            }
        } catch (error) {
            message.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (cat: Category) => {
        try {
            if (cat.id) await CategoriesService.updateCategory(cat.id, cat);
            else await CategoriesService.createCategory(cat);
            message.success("Category saved");
            fetchData();
        } catch (e) {
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await CategoriesService.deleteCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            message.success("Category deleted");
        } catch (e) { }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (
        <>
        {contextHolder}
        <CategoryView 
            categories={categories}
            devices={devices}
            taxes={taxes}
            onSave={handleSave}
            onDelete={handleDelete}
        />
        </>
    );
};

export default Categories;