const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Report Bridge...\n');

// Criar arquivos .env se não existirem
const createEnvFile = (source, destination) => {
  if (!fs.existsSync(destination)) {
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, destination);
      console.log(`✅ Criado: ${destination}`);
    } else {
      console.log(`⚠️  Arquivo exemplo não encontrado: ${source}`);
    }
  } else {
    console.log(`ℹ️  Já existe: ${destination}`);
  }
};

// Configurar backend
createEnvFile('env.example', '.env');

// Configurar frontend
const frontendEnvExample = path.join('frontend', 'env.example');
const frontendEnv = path.join('frontend', '.env');
createEnvFile(frontendEnvExample, frontendEnv);

console.log('\n📋 Próximos passos:');
console.log('1. Configure suas credenciais do Supabase nos arquivos .env');
console.log('2. Execute "npm install" na raiz, frontend/ e mobile/');
console.log('3. Configure o banco de dados no Supabase (veja README.md)');
console.log('4. Inicie o backend: npm run dev');
console.log('5. Inicie o frontend: cd frontend && npm start');
console.log('6. Inicie o mobile: cd mobile && npm start');

console.log('\n🔑 Variáveis importantes para configurar:');
console.log('- SUPABASE_URL');
console.log('- SUPABASE_ANON_KEY');
console.log('- SUPABASE_SERVICE_ROLE_KEY (opcional)');
console.log('- JWT_SECRET');

console.log('\n✨ Report Bridge configurado com sucesso!');

