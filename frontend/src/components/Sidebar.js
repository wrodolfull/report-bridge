import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart3,
  Users,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Visão geral do sistema'
    },
    {
      path: '/reports',
      icon: FileText,
      label: 'Relatórios',
      description: 'Gerenciar relatórios'
    },
    {
      path: '/testmenu',
      icon: Settings,
      label: 'Test Menu',
      description: 'Testes de integração GoTo'
    },
    {
      path: '/presence',
      icon: Settings,
      label: 'Presence',
      description: 'Dados de presença (GoTo)'
    },
    {
      path: '/call-queues',
      icon: Settings,
      label: 'Call Queues',
      description: 'Filas de atendimento (GoTo)'
    },
    {
      path: '/goto-call-events',
      icon: Phone,
      label: 'Call Events',
      description: 'Relatórios de eventos de chamadas (GoTo)'
    },
    {
      path: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'Análises e métricas'
    },
    {
      path: '/users',
      icon: Users,
      label: 'Usuários',
      description: 'Gerenciar usuários'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Configurações',
      description: 'Configurações do sistema'
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  title={collapsed ? `${item.label} - ${item.description}` : item.description}
                >
                  <Icon size={20} />
                  {!collapsed && (
                    <span className="nav-text">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="logout-btn"
          title={collapsed ? 'Logout - Sair do sistema' : 'Sair do sistema'}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

