import React from 'react';
import LoginView from '../features/auth/components/LoginView';
import { Employee } from '../shared/types';

interface LoginProps {
    onLogin: (user: Employee) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return <LoginView onLogin={onLogin} />;
};

export default Login;