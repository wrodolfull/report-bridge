import React, { useState, useEffect } from 'react';
import { gotoAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Header.css';

const Header = () => {
  const [gotoStatus, setGotoStatus] = useState({
    connected: false,
    loading: false
  });

           useEffect(() => {
           checkGotoStatus();
           
           // Verificar status periodicamente para detectar quando OAuth é completado
           const interval = setInterval(checkGotoStatus, 5000); // Verificar a cada 5 segundos
           
           return () => clearInterval(interval);
         }, []);

  const checkGotoStatus = async () => {
    try {
      const response = await gotoAPI.getStatus();
      if (response.data.success) {
        setGotoStatus(prev => ({
          ...prev,
          connected: response.data.connected
        }));
      }
    } catch (error) {
      console.error('Erro ao verificar status GoTo:', error);
    }
  };

           const handleGotoConnection = async () => {
           setGotoStatus(prev => ({ ...prev, loading: true }));

           try {
             if (gotoStatus.connected) {
               // Desconectar
               const response = await gotoAPI.disconnect();
               if (response.data.success) {
                 setGotoStatus({ connected: false, loading: false });
                 toast.success('Desconectado do GoTo com sucesso!');
               }
             } else {
               // Iniciar fluxo OAuth
               const response = await gotoAPI.getOAuthUrl();
               if (response.data.success && response.data.authUrl) {
                 // Abrir URL de autorização em nova janela
                 window.open(response.data.authUrl, '_blank', 'width=600,height=700');
                 setGotoStatus(prev => ({ ...prev, loading: false }));
                 toast.success('Abrindo autorização GoTo...');
               } else {
                 setGotoStatus(prev => ({ ...prev, loading: false }));
                 toast.error(response.data.message || 'Falha ao iniciar conexão com GoTo');
               }
             }
           } catch (error) {
             console.error('Erro na conexão GoTo:', error);
             setGotoStatus(prev => ({ ...prev, loading: false }));
             toast.error('Erro na conexão com GoTo');
           }
         };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Report Bridge</h1>
      </div>
      <div className="header-right">
        <button
          className={`goto-connect-btn ${gotoStatus.connected ? 'connected' : ''} ${gotoStatus.loading ? 'loading' : ''}`}
          onClick={handleGotoConnection}
          disabled={gotoStatus.loading}
          title={gotoStatus.connected ? 'Desconectar do GoTo' : 'Conectar com GoTo'}
        >
          <img 
            src="/goto-logo.png" 
            alt="GoTo" 
            className="goto-logo"
          />
          <span className="goto-text">
            {gotoStatus.loading ? 'Conectando...' : gotoStatus.connected ? 'Conectado' : 'Conectar'}
          </span>
          <div className={`status-indicator ${gotoStatus.connected ? 'connected' : 'disconnected'}`} />
        </button>
      </div>
    </header>
  );
};

export default Header;
