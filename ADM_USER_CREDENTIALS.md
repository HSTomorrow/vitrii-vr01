# 🔐 Usuário ADM - Credenciais e Acesso

## Credenciais de Acesso

> **IMPORTANTE**: Guarde estas credenciais com segurança!

```
Email:    admin@vitrii.com.br
Senha:    Admin@2025
Tipo:     ADM (Administrador)
ID:       2
Status:   Ativo
```

## Como Fazer Login

1. Acesse a página de login: `/auth/signin`
2. Digite o email: **admin@vitrii.com.br**
3. Digite a senha: **Admin@2025**
4. Clique em "Entrar"

## Telas Disponíveis para ADM

Após fazer login como ADM, você terá acesso a 2 painéis administrativos na barra de header:

### 1️⃣ **Painel de Administrador** (Amarelo 🟨)

- **Rota**: `/admin/dashboard`
- **O que faz**:
  - Gerenciar usuários do sistema
  - Visualizar todas as permissões (funcionalidades)
  - Atribuir/remover permissões de usuários
  - Consultar quais funcionalidades cada usuário tem acesso

### 2️⃣ **Gerenciar Anúncios** (Laranja 🟧)

- **Rota**: `/admin/anuncios`
- **O que faz**:
  - Visualizar TODOS os anúncios da plataforma
  - Editar qualquer anúncio (título, descrição, preço, etc.)
  - Ativar/desativar anúncios
  - Marcar/desmarcar anúncios como em destaque (⭐)
  - Deletar anúncios problemáticos
  - Filtrar e buscar anúncios por:
    - Título
    - Nome da loja
    - Nome do produto
    - Status (ativo/inativo/destaque)

## Funcionalidades Disponíveis

Como usuário ADM, você tem acesso automático a TODAS as 14 funcionalidades do sistema:

### Gerenciamento de Usuários (3)

✅ MANAGE_USERS - Criar, editar, deletar usuários  
✅ VIEW_USERS - Visualizar lista de usuários  
✅ MANAGE_USER_PERMISSIONS - Gerenciar permissões de usuários

### Gerenciamento de Anúncios (3)

✅ MANAGE_ADS - Criar, editar, deletar anúncios  
✅ VIEW_ALL_ADS - Visualizar todos os anúncios  
✅ MANAGE_FEATURED_ADS - Marcar anúncios como em destaque

### Gerenciamento de Lojas (2)

✅ MANAGE_STORES - Criar, editar, deletar lojas  
✅ VIEW_ALL_STORES - Visualizar todas as lojas

### Gerenciamento de Chat (2)

✅ MANAGE_CHATS - Gerenciar conversas  
✅ VIEW_ALL_CHATS - Visualizar todas as conversas

### Gerenciamento de Pagamentos (2)

✅ MANAGE_PAYMENTS - Gerenciar pagamentos  
✅ VIEW_PAYMENT_REPORTS - Visualizar relatórios de pagamento

### Relatórios e Sistema (2)

✅ VIEW_REPORTS - Acessar relatórios  
✅ MANAGE_SITE - Acesso total ao site

## Recursos do Painel de Anúncios

### Busca e Filtros

- **Search Bar**: Busque por título, nome da loja ou produto
- **Status Filter**: Filtro para todos, apenas ativos, apenas inativos, ou em destaque

### Ações Disponíveis por Anúncio

Ao expandir um anúncio, você pode:

1. **Editar** 📝
   - Muda para a página de edição do anúncio
   - Permite editar título, descrição, preço, fotos, etc.

2. **Ativar/Desativar** 👁️
   - Se ativo → desativa o anúncio
   - Se inativo → ativa o anúncio
   - Afeta a visibilidade no marketplace

3. **Destacar/Remover Destaque** ⭐
   - Marca anúncio como em destaque
   - Anúncios em destaque aparecem primeiro no marketplace
   - Mostra um ícone de estrela especial

4. **Deletar** 🗑️
   - Remove o anúncio permanentemente do sistema
   - Pede confirmação antes de deletar

### Informações Exibidas

Para cada anúncio, você pode ver:

- Foto/thumbnail do anúncio
- Título completo
- Loja e produto associados
- Status (Ativo/Inativo)
- Estado do anúncio (em_edicao, aguardando_pagamento, pago, histórico)
- Preço do anúncio
- Ícone de destaque se aplicável
- Data de criação

## Exemplo de Uso

### Cenário: Desativar um anúncio problemático

1. Login com: **admin@vitrii.com.br** / **Admin@2025**
2. Clique no botão laranja **"Anúncios"** no header
3. Use a barra de busca para encontrar o anúncio
4. Clique para expandir o anúncio
5. Clique no botão **"Desativar"**
6. Confirmação de sucesso!

### Cenário: Editar informações de um anúncio

1. Login com credenciais ADM
2. Acesse **"Anúncios"** no header
3. Encontre o anúncio
4. Expanda para ver detalhes
5. Clique no botão **"Editar"**
6. Mude para a página de edição completa
7. Faça as alterações necessárias
8. Salve as mudanças

## Estrutura do Banco de Dados

O usuário ADM foi criado com as seguintes informações:

```
Tabela: usuarios
ID:              2
nome:            Administrador Vitrii
email:           admin@vitrii.com.br
senha:           Admin@2025
cpf:             00000000000
telefone:        0000000000
endereco:        Sistema Administrativo
tipoUsuario:     adm
isActive:        true
dataCriacao:     [Data de criação]
```

Todas as 14 funcionalidades foram automaticamente concedidas na tabela `usuarios_x_funcionalidades`.

## Mudança de Senha (Futura)

Para mudar a senha quando implementado:

1. Acesse a página de perfil
2. Procure por "Alterar Senha"
3. Digite a senha atual
4. Digite a nova senha
5. Confirme a nova senha

_Nota: Esta funcionalidade pode ser implementada em atualizações futuras_

## Notas de Segurança

⚠️ **Importante para Produção**:

- Esta configuração é para DESENVOLVIMENTO
- A senha está armazenada em texto simples (não é seguro para produção)
- Para produção, implemente hash de senhas com bcryptjs
- Mantenha estas credenciais seguras
- Nunca compartilhe a senha com usuários não autorizados
- Considere mudar a senha periodicamente

## Troubleshooting

### "Acesso negado" ao acessar painel ADM?

- Verifique se está logado como ADM
- Limpe o cache do navegador
- Faça logout e login novamente

### Não vejo os botões de ADM no header?

- Verifique se está logado
- Confirme que o tipo de usuário é "adm"
- Atualize a página

### Não consigo editar um anúncio?

- Clique no botão **"Editar"** dentro da lista de anúncios
- Isso levará para a página de edição completa
- Faça as mudanças necessárias
- Salve

## Arquivos Criados/Modificados

### Arquivos Novos

- `client/pages/AdminManageAds.tsx` - Painel de gerenciamento de anúncios (410 linhas)
- `create-adm-user.mjs` - Script para criar usuário ADM
- `ADM_USER_CREDENTIALS.md` - Este arquivo

### Arquivos Modificados

- `client/App.tsx` - Adicionada rota `/admin/anuncios`
- `client/components/Header.tsx` - Adicionado botão "Anúncios" para ADM

## Próximas Etapas

Após fazer login como ADM, você pode:

1. ✅ Explorar o Painel de Administrador
2. ✅ Gerenciar anúncios do sistema
3. ✅ Atribuir permissões a outros usuários
4. ✅ Monitorar o sistema

## Suporte

Para problemas ou dúvidas:

1. Verifique a documentação completa em `RBAC_IMPLEMENTATION.md`
2. Consulte o código em `client/pages/AdminManageAds.tsx`
3. Verifique os logs do servidor

---

## ✅ Setup Concluído!

O usuário ADM foi criado com sucesso e tem acesso a:

- ✅ Painel de Administrador (gerenciar usuários/permissões)
- ✅ Painel de Anúncios (editar qualquer anúncio)
- ✅ Todas as 14 funcionalidades do sistema

**Bem-vindo ao painel administrativo!** 🎉
