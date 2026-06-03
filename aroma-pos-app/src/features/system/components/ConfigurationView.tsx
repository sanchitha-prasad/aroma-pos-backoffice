import React, { useState, useEffect } from 'react';
import { 
    Tabs, 
    Form, 
    Input, 
    Select, 
    Switch, 
    Button, 
    Typography, 
    theme, 
    Divider, 
    Row, 
    Col, 
    TimePicker, 
    InputNumber, 
    Upload,
    Card,
    message,
    Empty,
    Space
} from 'antd';
import { 
    UploadOutlined, 
    SaveOutlined, 
    ShopOutlined, 
    CreditCardOutlined, 
    DesktopOutlined, 
    NotificationOutlined, 
    GiftOutlined, 
    CalendarOutlined, 
    QrcodeOutlined, 
    BranchesOutlined, 
    ClockCircleOutlined,
    PlusOutlined 
} from '@ant-design/icons';
import { apiClient } from '../../../shared/services/api/client';
import { authStore } from '../../../shared/services/auth/authStore';
import ImgCrop from 'antd-img-crop';
import { useCurrency } from '../../../shared/context/CurrencyContext';

const { Title, Text } = Typography;
const { Option } = Select;

const getBase64 = (file: any): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

interface ConfigurationViewProps {
    permissions: string[];
}

const ConfigurationView: React.FC<ConfigurationViewProps> = ({ permissions }) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();
    const [tenantSettings, setTenantSettings] = useState<Record<string, string>>({});
    const [logoUrl, setLogoUrl] = useState<string>('');
    const { currencySymbol } = useCurrency();

    const fetchSettings = async () => {
        try {
            const tenantId = authStore.tenantId;
            let ownerName = '';
            let ownerEmail = '';
            let ownerPhone = '';

            if (tenantId) {
                try {
                    // Get tenant details
                    const tenant = await apiClient.get<any>(`/api/tenants/${tenantId}`);
                    const emailToFind = tenant?.ownerEmail || tenant?.OwnerEmail || tenant?.email || tenant?.Email;

                    // Get users list
                    const users = await apiClient.get<any[]>(`/api/tenants/${tenantId}/users`);
                    const owner = users?.find((u: any) => u.email === emailToFind);

                    if (owner) {
                        ownerName = owner.name;
                        ownerEmail = owner.email;
                        ownerPhone = owner.phoneNumber || owner.phone || owner.loginNumber || '';
                    } else if (emailToFind) {
                        ownerEmail = emailToFind;
                    }
                } catch (err) {
                    console.error("Failed to fetch tenant/owner details", err);
                }
            }

            const data = await apiClient.get<any[]>('/api/tenant-settings');
            const settings: Record<string, string> = {};
            (data || []).forEach((item: any) => {
                settings[item.key] = item.value;
            });
            setTenantSettings(settings);
            setLogoUrl(settings['Logo'] || '');
            form.setFieldsValue({
                userName: ownerName || authStore.currentUser?.name || '',
                userEmail: ownerEmail || authStore.currentUser?.email || '',
                userPhone: ownerPhone || '',
                brandName: settings['BrandName'] || '',
                defaultCurrency: settings['DefaultCurrency'] || 'USD',
                defaultTimeZone: settings['DefaultTimeZone'] || 'UTC',
                logo: settings['Logo'] || '',
                merchantFeePercentage: Number(settings['MerchantFeePercentage']) || 0,
                isKdsAvailable: settings['IsKdsAvailable'] === 'true',
                isExpeditorAvailable: settings['IsExpeditorAvailable'] === 'true',
                branchCount: Number(settings['BranchCount']) || 0,
                branchCodePrefix: settings['BranchCodePrefix'] || '',
                posSessionTimeout: Number(settings['PosSessionTimeout']) || 0,
                serviceCharge: Number(settings['ServiceCharge']) || 0,
                cashbackPercentage: Number(settings['CashbackPercentage']) || 0,
                serviceChargeType: settings['ServiceChargeType'] || 'Percentage',
            });
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = () => {
        form.validateFields().then(async (values) => {
            try {
                const payload = [
                    { key: 'BrandName', value: String(values.brandName ?? '') },
                    { key: 'DefaultCurrency', value: String(values.defaultCurrency ?? '') },
                    { key: 'DefaultTimeZone', value: String(values.defaultTimeZone ?? '') },
                    { key: 'Logo', value: String(values.logo ?? '') },
                    { key: 'MerchantFeePercentage', value: String(values.merchantFeePercentage ?? 0) },
                    { key: 'IsKdsAvailable', value: String(values.isKdsAvailable ?? false) },
                    { key: 'IsExpeditorAvailable', value: String(values.isExpeditorAvailable ?? false) },
                    { key: 'BranchCount', value: String(values.branchCount ?? 0) },
                    { key: 'BranchCodePrefix', value: String(values.branchCodePrefix ?? '') },
                    { key: 'PosSessionTimeout', value: String(values.posSessionTimeout ?? 0) },
                    { key: 'ServiceCharge', value: String(values.serviceCharge ?? 0) },
                    { key: 'CashbackPercentage', value: String(values.cashbackPercentage ?? 0) },
                    { key: 'ServiceChargeType', value: String(values.serviceChargeType ?? 'Percentage') }
                ];
                await apiClient.put('/api/tenant-settings', payload);
                message.success("Configurations saved successfully!");
                fetchSettings();
            } catch (error) {
                console.error("Failed to save settings", error);
                message.error("Failed to save configurations.");
            }
        });
    };

    const beforeUpload = (file: any) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
            return Upload.LIST_IGNORE;
        }
        
        getBase64(file).then(base64 => {
            setLogoUrl(base64);
            form.setFieldsValue({ logo: base64 });
        });
        
        return false;
    };

    const renderSaveButton = () => (
        <>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                >
                    Save Changes
                </Button>
            </div>
        </>
    );

    const ScrollablePane: React.FC<{children: React.ReactNode}> = ({children}) => (
        <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: 24, paddingLeft: 4 }}>
            {children}
        </div>
    );

    const allTabs = [
        {
            key: '1',
            permission: 'BackOffice:config:business',
            label: <span><ShopOutlined /> Business Profile</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Form form={form} layout="vertical">
                            {/* SECTION 1: Business Profile & Branding */}
                            <Title level={4}>Business Profile & Branding</Title>
                            <Divider titlePlacement={"left" as any}>Owner Configurations</Divider>
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item name="userName" label="Name">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="userEmail" label="Email">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="userPhone" label="Contact Number">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div style={{ marginTop: 24 }}></div>

                            {/* SECTION 2: Tenant Configuration */}
                            <Divider titlePlacement={"left" as any}>Tenant Configurations</Divider>
                            
                            <Row gutter={24} align="middle">
                                <Col span={16}>
                                    <Form.Item name="brandName" label="Business Name">
                                        <Input placeholder="Enter business name" />
                                    </Form.Item>
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item name="defaultTimeZone" label="Time Zone">
                                                <Select disabled>
                                                    <Option value="Asia/Colombo">Asia/Colombo</Option>
                                                    <Option value="EST">Eastern Standard Time</Option>
                                                    <Option value="PST">Pacific Standard Time</Option>
                                                    <Option value="UTC">UTC</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Country">
                                                <Select defaultValue="USA" disabled>
                                                    <Option value="USA">Sri Lanka</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item name="defaultCurrency" label="Currency">
                                                <Select disabled>
                                                    <Option value="LKR">LKR</Option>
                                                    <Option value="USD">USD ($)</Option>
                                                    <Option value="EUR">EUR (€)</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Form.Item name="logo" label="Brand Logo" style={{ marginBottom: 0 }}>
                                        <ImgCrop rotationSlider aspect={1}>
                                            <Upload
                                                name="logo"
                                                listType="picture-card"
                                                showUploadList={false}
                                                beforeUpload={beforeUpload}
                                            >
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <div>
                                                        <PlusOutlined />
                                                        <div style={{ marginTop: 8 }}>Upload Logo</div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </ImgCrop>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item name="branchCodePrefix" label="Branch Code Prefix">
                                        <Input placeholder="BR" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="branchCount" label="Branch Count Limit">
                                        <InputNumber disabled style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="posSessionTimeout" label="POS Session Timeout (mins)">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item name="serviceCharge" label="Service Charge">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="serviceChargeType" label="Service Charge Type">
                                        <Select>
                                            <Option value="Percentage">Percentage</Option>
                                            <Option value="Fixed">Fixed</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="merchantFeePercentage" label="Merchant Fee (%)">
                                        <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item name="cashbackPercentage" label="Cashback Percentage (%)">
                                        <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="isKdsAvailable" valuePropName="checked" label="KDS Available">
                                        <Switch  disabled/>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="isExpeditorAvailable" valuePropName="checked" label="Expeditor Available">
                                        <Switch disabled/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '2',
            permission: 'BackOffice:config:payments',
            label: <span><CreditCardOutlined /> Payments</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Payment Gateway & Terminals</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Payment Processor">
                                <Select defaultValue="Stripe">
                                    <Option value="Stripe">Stripe</Option>
                                    <Option value="Square">Square</Option>
                                    <Option value="Clover">Clover</Option>
                                    <Option value="PAX">PAX Technology</Option>
                                </Select>
                            </Form.Item>
                            <Card size="small" title="Processor Credentials" style={{ marginBottom: 24 }}>
                                <Form.Item label="API Key / Token">
                                    <Input.Password placeholder="sk_test_..." />
                                </Form.Item>
                                <Form.Item label="Terminal IP / Port (If applicable)">
                                    <Input placeholder="192.168.1.50:10009" />
                                </Form.Item>
                            </Card>
                            
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Surcharge / Convenience Fee (%)">
                                        <InputNumber min={0} max={100} defaultValue={0} formatter={value => `${value}%`} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Tip Configuration">
                                        <Select defaultValue="Prompt on Terminal">
                                            <Option value="None">Disabled</Option>
                                            <Option value="Prompt on Screen">Prompt on POS Screen</Option>
                                            <Option value="Prompt on Terminal">Prompt on Card Terminal</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider style={{ fontSize: 14 }}>Rules</Divider>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Offline Mode" valuePropName="checked">
                                        <Switch /> <Text type="secondary" style={{ marginLeft: 8 }}>Allow transactions without internet</Text>
                                    </Form.Item>
                                    <Form.Item label="Auto-Close Card Batch" valuePropName="checked">
                                        <Switch defaultChecked />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Cash Drawer Opens On">
                                        <Select mode="multiple" defaultValue={['Cash Sale']}>
                                            <Option value="Cash Sale">Cash Sale</Option>
                                            <Option value="Card Sale">Card Sale</Option>
                                            <Option value="Refund">Refund</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '3',
            permission: 'BackOffice:config:kds',
            label: <span><DesktopOutlined /> KDS</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Kitchen Display System (KDS)</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Enable KDS Functionality" valuePropName="checked">
                                <Switch defaultChecked />
                            </Form.Item>
                            
                            <Form.Item label="Kitchen Routing Rules">
                                <Select defaultValue="Category Based">
                                    <Option value="Simple">Send all items to all screens</Option>
                                    <Option value="Category Based">Route by Category (e.g. Drinks to Bar)</Option>
                                    <Option value="Item Based">Route by specific item settings</Option>
                                </Select>
                            </Form.Item>

                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Sound / Beep Alerts" valuePropName="checked">
                                        <Switch defaultChecked />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Auto-clear Completed Orders (mins)">
                                        <InputNumber min={0} defaultValue={15} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '4',
            permission: 'BackOffice:config:alerts',
            label: <span><NotificationOutlined /> Alerts</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Notifications & Alerts</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Card size="small" style={{ marginBottom: 16 }}>
                                <Row align="middle" justify="space-between">
                                    <Col><Text strong>Low Stock Notifications</Text></Col>
                                    <Col><Switch defaultChecked /></Col>
                                </Row>
                            </Card>
                            <Card size="small" style={{ marginBottom: 16 }}>
                                <Row align="middle" justify="space-between">
                                    <Col><Text strong>Order Ready SMS (to Customer)</Text></Col>
                                    <Col><Switch /></Col>
                                </Row>
                            </Card>
                            
                            <Form.Item label="Email Alert Recipients (Comma separated)">
                                <Input.TextArea rows={2} placeholder="manager@restaurant.com, owner@restaurant.com" />
                            </Form.Item>

                            <Form.Item label="WhatsApp Integration">
                                <Select defaultValue="Disabled">
                                    <Option value="Disabled">Disabled</Option>
                                    <Option value="Twilio">Via Twilio</Option>
                                    <Option value="Business API">WhatsApp Business API</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '5',
            permission: 'BackOffice:config:view',
            label: <span><GiftOutlined /> Loyalty</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Customer Loyalty & Rewards</Title>
                        <Divider />

                        <Form layout="vertical">
                        <Row gutter={24}>
                            <Col span={12}>
                            <Form.Item label="Points Earning Rule">
                                <Space.Compact style={{ width: "100%" }}>
                                <Input value="Earn 1 point per" disabled style={{ width: "60%" }} />
                                <Input defaultValue="1" style={{ width: "20%" }} />
                                <Input value={`${currencySymbol} spent`} disabled style={{ width: "20%" }} />
                                </Space.Compact>
                            </Form.Item>
                            </Col>

                            <Col span={12}>
                            <Form.Item label="Redemption Rule">
                                <Space.Compact style={{ width: "100%" }}>
                                <Input value="Redeem 100 points for" disabled style={{ width: "70%" }} />
                                <Input defaultValue="5" style={{ width: "15%" }} />
                                <Input value={`${currencySymbol} credit`} disabled style={{ width: "15%" }} />
                                </Space.Compact>
                            </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Loyalty Tiers">
                            <Select mode="tags" defaultValue={["Silver", "Gold", "VIP"]} />
                        </Form.Item>

                        <Form.Item label="Birthday Reward">
                            <Input placeholder="e.g. Free Dessert" />
                        </Form.Item>
                        </Form>

                        {renderSaveButton()}
                    </div>
                    </ScrollablePane>
            )
        },
        {
            key: '6',
            permission: 'BackOffice:config:view',
            label: <span><GiftOutlined /> Gift Cards</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Gift Card System</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Card Expiry (Months from issue)">
                                <InputNumber min={0} defaultValue={12} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item label="Allow Partial Redemption" valuePropName="checked">
                                <Switch defaultChecked />
                            </Form.Item>
                             <Form.Item label="Reload Rules">
                                <Select defaultValue="Any Amount">
                                    <Option value="Any Amount">Any Amount</Option>
                                    <Option value="Fixed Denominations">Fixed Denominations ({currencySymbol}10, {currencySymbol}20, {currencySymbol}50)</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '7',
            permission: 'BackOffice:config:view',
            label: <span><CalendarOutlined /> Reservations</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Reservation Settings</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label="Time Slot Duration (mins)">
                                        <InputNumber step={15} defaultValue={90} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="Max Party Size">
                                        <InputNumber min={1} defaultValue={10} style={{ width: '100%' }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label="Require Deposit">
                                <Select defaultValue="For Parties > 6">
                                    <Option value="Never">Never</Option>
                                    <Option value="Always">Always</Option>
                                    <Option value="For Parties > 6">For Parties &gt; 6</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Auto-cancel Policy (mins late)">
                                <InputNumber min={5} defaultValue={15} />
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '8',
            permission: 'BackOffice:config:reports',
            label: <span><BranchesOutlined /> Reports</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Reports Customization</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Scheduled Email Reports">
                                <Select mode="multiple" defaultValue={['Daily Sales', 'Labor Cost']}>
                                    <Option value="Daily Sales">Daily Sales</Option>
                                    <Option value="Weekly Summary">Weekly Summary</Option>
                                    <Option value="Labor Cost">Labor Cost</Option>
                                    <Option value="Inventory Low Stock">Inventory Low Stock</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="KPI Dashboard Widgets">
                                <Select mode="multiple" defaultValue={['Revenue', 'Top Items']}>
                                    <Option value="Revenue">Total Revenue</Option>
                                    <Option value="Top Items">Top Selling Items</Option>
                                    <Option value="Void Tracks">Void Tracks</Option>
                                    <Option value="Labor %">Labor Percentage</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '9',
            permission: 'BackOffice:config:view',
            label: <span><QrcodeOutlined /> QR Ordering</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>QR Ordering</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Enable QR Ordering" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item label="Payment Flow">
                                <Select defaultValue="Pay at Table">
                                    <Option value="Pay to Order">Pay before ordering</Option>
                                    <Option value="Pay at Table">Order first, pay later</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="Order Throttling (Max orders/min)">
                                <InputNumber min={0} defaultValue={5} />
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '10',
            permission: 'BackOffice:config:view',
            label: <span><BranchesOutlined /> Multi-Store</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Multi-Store / Franchise</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Store Linking ID">
                                <Input placeholder="Enter HQ Link ID" />
                            </Form.Item>
                            <Form.Item label="Centralized Menu Management" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item label="Share Inventory Across Stores" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                            <Form.Item label="Allow Store-level Overrides" valuePropName="checked">
                                <Switch defaultChecked />
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        },
        {
            key: '11',
            permission: 'BackOffice:config:shifts',
            label: <span><ClockCircleOutlined /> Shifts</span>,
            children: (
                <ScrollablePane>
                    <div style={{ maxWidth: 800 }}>
                        <Title level={4}>Business Day & Shift</Title>
                        <Divider />
                        <Form layout="vertical">
                            <Form.Item label="Business Day Start Time">
                                <TimePicker format="HH:mm" />
                            </Form.Item>
                            <Form.Item label="Auto End-of-Day" valuePropName="checked">
                                <Switch /> <Text type="secondary" style={{ marginLeft: 8 }}>Automatically close business day at cutoff</Text>
                            </Form.Item>
                            <Form.Item label="Shift Summary Requirements">
                                <Select mode="multiple" defaultValue={['Cash Count', 'Manager Approval']}>
                                    <Option value="Cash Count">Cash Count Blind</Option>
                                    <Option value="Manager Approval">Manager Approval</Option>
                                    <Option value="Clock Out All">Clock Out All Employees</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        {renderSaveButton()}
                    </div>
                </ScrollablePane>
            )
        }
    ];

    const visibleTabs = allTabs.filter(tab => permissions.includes(tab.permission));

    if (visibleTabs.length === 0) {
        return (
             <div style={{ padding: 48, display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <Empty description="No configuration modules available for your role." />
             </div>
        );
    }

    return (
        <div style={{ 
            padding: 24, 
            height: '100%', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column' 
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Configurations</Title>
            </div>
            
            <div style={{ 
                background: token.colorBgContainer, 
                borderRadius: 12, 
                border: `1px solid ${token.colorBorderSecondary}`,
                flex: 1,
                overflow: 'hidden',
                padding: '24px 0'
            }}>
                <Tabs 
                    tabPlacement="start" 
                    items={visibleTabs} 
                    style={{ height: '100%' }}
                    tabBarStyle={{ width: 220 }}
                />
            </div>
        </div>
    );
};

export default ConfigurationView;