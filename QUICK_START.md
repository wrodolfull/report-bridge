# 🚀 Quick Start - Report Bridge

Guia rápido para colocar o Report Bridge funcionando em minutos!

## ⚡ Instalação Rápida

### 1. Clone o projeto
```bash
git clone <url-do-repositorio>
cd report-bridge
```

### 2. Instale todas as dependências
```bash
npm run install-all
```

### 3. Configure o ambiente
```bash
npm run setup
```

### 4. Configure o Supabase

1. **Crie uma conta no [Supabase](https://supabase.com)**
2. **Crie um novo projeto**
3. **Execute o script SQL no SQL Editor:**
   - Copie o conteúdo de `supabase_schema.sql`
   - Cole no SQL Editor do Supabase
   - Execute o script
 
4. **Configure as variáveis de ambiente:**

**Arquivo `.env` (raiz):**
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
JWT_SECRET=uma_chave_secreta_forte
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Arquivo `frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_chave_anon_key
```

### 5. Inicie todos os serviços

**Opção 1 - Tudo junto:**
```bash
npm run dev-all
```

**Opção 2 - Separadamente:**
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run client

# Terminal 3: Mobile
npm run mobile
```

## 🎯 URLs de Acesso

- **Backend API**: http://localhost:3001
- **Frontend Web**: http://localhost:3000
- **Mobile**: Expo DevTools irá abrir automaticamente

## 📱 Testando o Mobile

1. Instale o **Expo Go** no seu celular
2. Execute `npm run mobile`
3. Escaneie o QR code com o Expo Go

## 🔐 Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Criar conta"
3. Preencha email, senha e nome
4. Faça login e comece a usar!

## ⚙️ Onde Encontrar as Chaves do Supabase

1. Acesse seu projeto no Supabase
2. Vá em **Settings** > **API**
3. Copie:
   - **URL**: Project URL
   - **ANON_KEY**: anon public
   - **SERVICE_ROLE_KEY**: service_role (cuidado - mantenha secreta!)

## 🏗️ Estrutura de Teste

O sistema vem com:
- ✅ Autenticação completa
- ✅ CRUD de relatórios
- ✅ Dashboard com estatísticas
- ✅ Interface responsiva
- ✅ App mobile funcional

## 🔧 Comandos Úteis

```bash
# Instalar dependências de tudo
npm run install-all

# Configurar ambiente inicial
npm run setup

# Rodar backend + frontend
npm run dev-all

# Build para produção
npm run build

# Apenas backend
npm run dev

# Apenas frontend
npm run client

# Apenas mobile
npm run mobile
```

## 🚨 Solução de Problemas

### Erro "Cannot connect to API"
- Verifique se o backend está rodando na porta 3001
- Confirme as URLs nos arquivos .env

### Erro no Supabase
- Verifique se executou o script SQL
- Confirme se as chaves estão corretas nos .env

### Expo não abre
- Instale o Expo CLI globalmente: `npm install -g @expo/cli`
- Certifique-se que está na pasta mobile: `cd mobile && npm start`

### Mobile não conecta com API
- Se usando dispositivo físico, altere `localhost` para o IP da máquina
- No arquivo `mobile/src/services/api.js`, linha 5

## 🎉 Pronto!

Agora você tem um sistema completo funcionando com:
- 🌐 **Web Dashboard** moderno
- 📱 **App Mobile** nativo
- 🚀 **API REST** robusta
- 🔐 **Autenticação** segura
- 📊 **Relatórios** dinâmicos

## 📞 Precisa de Ajuda?

Verifique o `README.md` para documentação completa ou entre em contato!

---

**Report Bridge** - Sistema de Relatórios Completo 🚀

