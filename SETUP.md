# Guia de Configuração - Prime Barbearia

## 🚀 Desenvolvimento Local

### Pré-requisitos
1. Node.js 18+ instalado
2. MongoDB Atlas configurado ou MongoDB local rodando
3. Variáveis de ambiente configuradas

### Configuração Inicial

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net
   MONGODB_DBNAME=barberia
   ```

3. **Inicie o servidor de desenvolvimento:**

   **Opção 1: Rodar tudo junto (recomendado)**
   ```bash
   npm run dev:all
   ```
   Isso iniciará:
   - Servidor da API na porta 3001
   - Vite dev server na porta 3000

   **Opção 2: Rodar separadamente**
   
   Terminal 1 - API:
   ```bash
   npm run dev:api
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001/api/scheduling

## 📦 Deploy no Vercel

### Passo 1: Preparar o Projeto

O projeto já está configurado para deploy no Vercel. Certifique-se de que:
- ✅ `vercel.json` está na raiz
- ✅ `api/scheduling.js` existe e está configurado
- ✅ Todas as dependências estão no `package.json`

### Passo 2: Configurar Variáveis de Ambiente no Vercel

1. Acesse o painel do Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione:

   **MONGODB_URI**
   - Value: `mongodb+srv://usuario:senha@cluster.mongodb.net`
   - Environment: Production, Preview, Development (marque todos)

   **MONGODB_DBNAME** (opcional)
   - Value: `barberia`
   - Environment: Production, Preview, Development (marque todos)

### Passo 3: Deploy

1. Faça commit e push:
   ```bash
   git add .
   git commit -m "Deploy: Configuração completa"
   git push
   ```

2. O Vercel detectará automaticamente e fará o deploy

### Passo 4: Verificar

Após o deploy, teste:
- ✅ Página principal: `https://seu-projeto.vercel.app`
- ✅ Painel Admin: `https://seu-projeto.vercel.app/admin`
- ✅ API: `https://seu-projeto.vercel.app/api/scheduling`

## 🐛 Troubleshooting

### Erro 404 na API em desenvolvimento
- Certifique-se de que o servidor de desenvolvimento da API está rodando (`npm run dev:api`)
- Verifique se a porta 3001 não está ocupada

### Erro 404 na API no Vercel
- Verifique os logs no painel do Vercel
- Confirme que `api/scheduling.js` existe na raiz do projeto
- Certifique-se de que as variáveis de ambiente estão configuradas

### Erro de conexão MongoDB
- Verifique a string de conexão no MongoDB Atlas
- Confirme que o IP whitelist permite conexões do Vercel (0.0.0.0/0)
- Teste a conexão localmente primeiro

## 📝 Estrutura do Projeto

```
primeshop/
├── api/
│   └── scheduling.js          # Serverless function (Vercel)
├── api-dev-server.js          # Servidor dev local
├── src/
│   ├── App.tsx               # Página principal
│   ├── Admin.tsx             # Painel admin
│   └── MainRouter.tsx        # Rotas
├── vercel.json               # Config Vercel
└── package.json              # Dependências
```

## ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] MongoDB Atlas com IP whitelist configurado
- [ ] Testado localmente com `npm run dev:all`
- [ ] Build passa sem erros (`npm run build`)
- [ ] Código commitado e pushado para o repositório

