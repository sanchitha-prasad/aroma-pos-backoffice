import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Typography, theme, Row, Col, Grid, Modal } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Employee } from '../../../shared/types';
import { authService } from '../api/auth.service';
import { showErrorMessage } from '@/src/shared/types/ui/ErrorMessageModel';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface LoginViewProps {
  onLogin: (user: Employee) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [popup, contextHolder] = Modal.useModal();
  
  const screens = useBreakpoint();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const user = await authService.login(values.email, values.password);
      onLogin(user);
    } catch (error: any) {
      console.error("Login flow caught error", error);

      showErrorMessage(popup, error, "Login Failed");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: token.colorBgLayout }}>
      {contextHolder}

      <Row style={{ height: '100%' }}>
        <Col 
          xs={0} md={12} lg={14}
          style={{ 
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #3b0a45 100%)`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '60%', height: '60%', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}></div>
            
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: 60, maxWidth: 600 }}>
                <div style={{ 
                    width: 80, height: 80, 
                    background: 'rgba(255,255,255,0.1)', 
                    backdropFilter: 'blur(20px)',
                    borderRadius: 20, 
                    margin: '0 auto 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, color: '#fff', fontWeight: 800,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    A
                </div>
                <Title level={1} style={{ color: '#fff', marginBottom: 24, fontSize: 48 }}>Aroma POS</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, lineHeight: 1.6 }}>
                    Manage your restaurant operations with precision, speed, and intelligence. 
                    The comprehensive ERP solution for the modern food industry.
                </Paragraph>
            </div>
        </Col>

        <Col 
          xs={24} md={12} lg={10}
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: token.colorBgContainer
          }}
        >
            <div style={{ width: '100%', maxWidth: 420, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2} style={{ color: token.colorPrimary, marginBottom: 8 }}>Welcome Back</Title>
                    <Text type="secondary">Please enter your credentials to access your dashboard.</Text>
                </div>

                <Form
                    name="login_form"
                    layout="vertical"
                    size="large"
                    onFinish={onFinish}
                    initialValues={{ remember: true }}
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />} placeholder="name@company.com" autoComplete="username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />} placeholder="••••••••" autoComplete="current-password" />
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>
                        <a href="#" style={{ color: token.colorPrimary, fontWeight: 500 }}>Forgot Password?</a>
                    </div>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            block 
                            loading={loading}
                            icon={!loading && <LoginOutlined />}
                            style={{ 
                                height: 48, 
                                fontSize: 16, 
                                borderRadius: 8,
                                fontWeight: 600
                            }}
                        >
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Aroma POS System v2.0 • Secure Connection
                    </Text>
                </div>
            </div>
        </Col>
      </Row>
    </div>
  );
};

export default LoginView;