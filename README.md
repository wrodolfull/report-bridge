# Report Bridge

Sistema completo de relatórios com frontend web, aplicativo mobile e backend integrado ao Supabase.

## 🚀 Funcionalidades

- ✅ **Autenticação completa** via GoTo/Supabase
- ✅ **Frontend React** com interface moderna
- ✅ **Menu lateral preto** com ícones e fonte branca
- ✅ **Backend Node.js** com Express
- ✅ **Aplicativo Mobile** React Native
- ✅ **Integração Supabase** para banco de dados
- ✅ **CRUD de Relatórios** completo
- ✅ **Dashboard** com estatísticas
- ✅ **Logout** funcional

## 📱 Plataformas

- **Web**: React.js com interface responsiva
- **Mobile**: React Native (iOS/Android)
- **Backend**: Node.js + Express + Supabase

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL)
- JWT para autenticação
- Cors, Helmet, Rate Limiting

### Frontend Web
- React.js
- React Router DOM
- Axios
- Lucide React (ícones)
- React Hot Toast

### Mobile
- React Native
- Expo
- React Navigation
- React Native Paper
- React Native Vector Icons

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Expo CLI (para mobile)

## 🔧 Configuração

### 1. Backend

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp env.example .env
 
# Configurar variáveis no .env:
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_supabase
JWT_SECRET=sua_chave_jwt_secreta

# Iniciar servidor
npm run dev
```

### 2. Frontend Web

```bash
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp env.example .env

# Configurar variáveis no .env:
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=sua_url_supabase
REACT_APP_SUPABASE_ANON_KEY=sua_chave_supabase

# Iniciar aplicação
npm start
```

### 3. Mobile

```bash
cd mobile

# Instalar dependências
npm install

# Iniciar Expo
npm start

# Para rodar no dispositivo:
npm run android  # Android
npm run ios      # iOS
```

## 🗄️ Configuração do Banco de Dados (Supabase)

### Tabela de Relatórios

Execute no SQL Editor do Supabase:

```sql
-- Criar tabela de relatórios
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'general',
    data JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas seus próprios relatórios
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para usuários criarem relatórios
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem seus próprios relatórios
CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy para usuários deletarem seus próprios relatórios
CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE USING (auth.uid() = user_id);
```

## 🎯 Estrutura do Projeto

```
Report Bridge/
├── backend/
│   ├── config/
│   │   └── supabase.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   └── styles/
│   ├── App.js
│   └── package.json
└── README.md
```

## 🌟 Funcionalidades Principais

### Autenticação
- Login via email/senha
- Registro de novos usuários
- Logout seguro
- Verificação automática de token
- Suporte a autenticação GoTo (empresarial)

### Dashboard
- Estatísticas de relatórios
- Relatórios recentes
- Ações rápidas
- Gráficos e métricas

### Relatórios
- Criar relatórios
- Editar relatórios
- Excluir relatórios
- Filtrar por tipo
- Busca por texto
- Diferentes tipos: Geral, Vendas, Financeiro, Marketing, Operações

### Interface
- Design moderno e responsivo
- Menu lateral preto com ícones brancos
- Navegação intuitiva
- Feedback visual (toasts)
- Loading states

## 📱 Mobile Features

- **Drawer Navigation** - Menu lateral elegante
- **Autenticação completa** - Login/Register
- **Dashboard nativo** - Estatísticas e cards
- **CRUD de Relatórios** - Funcionalidade completa
- **Configurações** - Perfil e preferências
- **Offline ready** - Estrutura preparada

## 🔒 Segurança

- Autenticação JWT
- Rate limiting
- CORS configurado
- Helmet para headers de segurança
- Row Level Security no Supabase
- Validação de entrada
- Sanitização de dados

## 🚀 Deployment

### Backend
- Configurar variáveis de ambiente em produção
- Deploy no Heroku, Railway, ou Vercel
- Configurar URL do frontend no CORS

### Frontend
- Build de produção: `npm run build`
- Deploy no Vercel, Netlify, ou GitHub Pages
- Configurar URL da API em produção

### Mobile
- Build APK: `expo build:android`
- Build iOS: `expo build:ios`
- Publicar na App Store/Google Play

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- 📧 Email: support@reportbridge.com
- 📱 WhatsApp: +55 (11) 99999-9999
- 🌐 Website: https://reportbridge.com

---

Desenvolvido com ❤️ usando React, React Native e Node.js

