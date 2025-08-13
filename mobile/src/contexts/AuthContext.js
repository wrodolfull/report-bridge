import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        await verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Erro ao carregar token:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (tokenToVerify = token) => {
    try {
      const response = await authAPI.verify(tokenToVerify);
      if (response.data.success) {
        setUser(response.data.user);
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      await logout();
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        await AsyncStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        
        return { success: true };
      }
      
      return { success: false, error: 'Credenciais inválidas' };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await authAPI.register(email, password, name);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, error: 'Erro ao criar conta' };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao criar conta' 
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout(token);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyToken,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

