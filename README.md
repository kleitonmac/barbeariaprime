# Prime Barbearia - Sistema de Agendamento

Sistema completo de agendamento para barbearia com painel administrativo e dashboard de lucros.

## 🚀 Funcionalidades

- ✅ Sistema de agendamento online
- ✅ Painel administrativo protegido por senha
- ✅ Dashboard com lucro diário e mensal
- ✅ Integração com MongoDB para persistência de dados
- ✅ Interface moderna e responsiva
- ✅ Deploy pronto para Vercel

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no MongoDB Atlas ou MongoDB local
- Conta no Vercel para deploy

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd primeshop
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto:
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net
MONGODB_DBNAME=barberia
```

## 🚀 Deploy no Vercel

### Passo 1: Preparar o Projeto

1. Certifique-se de que todas as dependências estão no `package.json`
2. Verifique se o arquivo `vercel.json` está configurado corretamente

### Passo 2: Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket
3. Clique em "Add New Project"
4. Importe seu repositório

### Passo 3: Configurar Variáveis de Ambiente

No painel do Vercel, vá em Settings > Environment Variables e adicione:

- **MONGODB_URI**: Sua string de conexão do MongoDB
  - Exemplo: `mongodb+srv://usuario:senha@cluster.mongodb.net`
- **MONGODB_DBNAME**: Nome do banco de dados (opcional, padrão: `barberia`)

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde o processo de build e deploy
3. Seu site estará disponível em uma URL como `https://seu-projeto.vercel.app`

### Passo 5: Verificar Funcionamento

- Acesse a página principal: `https://seu-projeto.vercel.app`
- Acesse o painel admin: `https://seu-projeto.vercel.app/admin`
- Senha padrão: `prime2025#`

## 📁 Estrutura do Projeto

```
primeshop/
├── api/
│   └── scheduling.js          # API Serverless (Vercel)
├── models/
│   └── scheduling.ts          # Modelo MongoDB
├── src/
│   ├── App.tsx               # Página principal
│   ├── Admin.tsx             # Painel administrativo
│   └── MainRouter.tsx        # Roteamento
├── vercel.json               # Configuração Vercel
└── package.json              # Dependências
```

## 🎯 Funcionalidades do Dashboard

- **Lucro Diário**: Soma de todos os serviços realizados hoje
- **Lucro Mensal**: Soma de todos os serviços do mês atual
- **Gráfico de Lucros**: Visualização diária dos lucros do mês
- **Estatísticas**: Total de agendamentos e média diária

## 🔒 Segurança

- Senha do admin configurada em `src/Admin.tsx`
- Em produção, considere usar variáveis de ambiente para a senha
- MongoDB com autenticação segura

## 📝 Notas Importantes

1. **MongoDB Atlas**: Certifique-se de configurar o IP whitelist para permitir conexões do Vercel (0.0.0.0/0 para desenvolvimento)
2. **Preços**: Os preços são salvos automaticamente quando um agendamento é criado
3. **Dados Antigos**: Agendamentos criados antes da atualização podem não ter preço. Você pode editá-los no painel admin

## 🐛 Solução de Problemas

### Erro 404 na página /admin
- Verifique se o `vercel.json` está configurado corretamente
- Certifique-se de que o `MainRouter.tsx` está configurado

### Erro de conexão com MongoDB
- Verifique as variáveis de ambiente no Vercel
- Confira a string de conexão do MongoDB
- Verifique o whitelist de IPs no MongoDB Atlas

### API não funciona
- Verifique se o arquivo `api/scheduling.js` existe
- Confirme que o `package.json` tem a dependência `mongoose`
- Veja os logs no painel do Vercel

## 📞 Suporte

Para dúvidas ou problemas, verifique os logs do Vercel no painel de administração.

