import React, { useState, useEffect, useRef } from 'react';
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
           const interval = setInterval(checkGotoStatus, 3000); // Verificar a cada 3 segundos
           
           return () => clearInterval(interval);
         }, []);

  const hasShownConnectedToast = useRef(false);

  const checkGotoStatus = async () => {
    try {
      const response = await gotoAPI.getStatus();
      if (response.data.success) {
        const isNowConnected = response.data.connected;
        
        setGotoStatus(prev => ({
          ...prev,
          connected: isNowConnected
        }));
        
        // Mostrar toast apenas na transição para conectado, evitando loop por stale closure
        if (isNowConnected && !hasShownConnectedToast.current) {
          toast.success('🎉 GoTo conectado com sucesso! Tokens salvos.');
          hasShownConnectedToast.current = true;
        } else if (!isNowConnected) {
          // Reset quando desconectar
          hasShownConnectedToast.current = false;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status GoTo:', error);
    }
  };

           const handleGotoConnection = async () => {
           setGotoStatus(prev => ({ ...prev, loading: true }));

           try {
             if (gotoStatus.connected) {
               // Confirmar desconexão
               const confirmDisconnect = window.confirm(
                 'Deseja desconectar do GoTo?\n\nIsso irá revogar os tokens de acesso e você precisará se conectar novamente para usar as funcionalidades da GoTo.'
               );
               
               if (!confirmDisconnect) {
                 setGotoStatus(prev => ({ ...prev, loading: false }));
                 return;
               }

               // Desconectar
               const response = await gotoAPI.disconnect();
               if (response.data.success) {
                 setGotoStatus({ connected: false, loading: false });
                 toast.success(
                   response.data.tokenRevoked 
                     ? '✅ Desconectado e tokens revogados com sucesso!' 
                     : '⚠️ Desconectado localmente (tokens podem ainda estar ativos)'
                 );
               } else {
                 setGotoStatus(prev => ({ ...prev, loading: false }));
                 toast.error('Erro ao desconectar do GoTo');
               }
             } else {
               // Iniciar fluxo OAuth
               const response = await gotoAPI.getOAuthUrl();
               if (response.data.success && response.data.authUrl) {
                 // Abrir URL de autorização em nova janela
                 const oauthWindow = window.open(response.data.authUrl, '_blank', 'width=600,height=700');
                 setGotoStatus(prev => ({ ...prev, loading: false }));
                 toast.success('Abrindo autorização GoTo...');
                 
                 // Monitorar quando a janela é fechada para verificar status
                 const checkClosed = setInterval(() => {
                   if (oauthWindow && oauthWindow.closed) {
                     clearInterval(checkClosed);
                     // Verificar status após 2 segundos
                     setTimeout(() => {
                       checkGotoStatus();
                     }, 2000);
                   }
                 }, 1000);
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
          title={gotoStatus.connected 
            ? 'Clique para desconectar do GoTo (revoga tokens de acesso)' 
            : 'Clique para conectar com GoTo'
          }
        >
          <img 
            src="/goto-logo.png" 
            alt="GoTo" 
            className="goto-logo"
          />
          <span className="goto-text">
            {gotoStatus.loading 
              ? (gotoStatus.connected ? 'Desconectando...' : 'Conectando...')
              : gotoStatus.connected 
                ? 'Desconectar' 
                : 'Conectar'
            }
          </span>
          <div className={`status-indicator ${gotoStatus.connected ? 'connected' : 'disconnected'}`} />
        </button>
      </div>
    </header>
  );
};

export default Header;
