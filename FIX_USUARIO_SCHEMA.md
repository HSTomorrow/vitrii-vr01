# Fix para Erro de Criação de Usuário

## 🔴 Problema Encontrado

Ao tentar criar uma conta nova, recebia um erro HTTP 500:
```
Error: The column `usuarios.endereco` does not exist in the current database.
```

### Causa Raiz
A tabela `usuarios` foi criada com a migração inicial, mas **não incluía todas as colunas** definidas no schema Prisma:
- ❌ `cpf` - faltava
- ❌ `telefone` - faltava  
- ❌ `endereco` - faltava
- ❌ `tipoUsuario` - faltava

## ✅ Solução Implementada

Executei uma migração SQL para adicionar as colunas faltantes à tabela `usuarios`:

```sql
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cpf" VARCHAR(11);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" VARCHAR(20);
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "tipoUsuario" VARCHAR(255) DEFAULT 'comum';
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_cpf_key" ON "usuarios"("cpf") WHERE "cpf" IS NOT NULL;
```

### Alterações Realizadas:

1. **Adicionada coluna `cpf`** (VARCHAR 11, nullable)
   - Permite armazenar CPF do usuário
   - Unique constraint com filtro para valores não-nulos

2. **Adicionada coluna `telefone`** (VARCHAR 20, nullable)
   - Permite armazenar número de telefone

3. **Adicionada coluna `endereco`** (TEXT, nullable)
   - Permite armazenar endereço completo

4. **Adicionada coluna `tipoUsuario`** (VARCHAR 255, default 'comum')
   - Define tipo de usuário ("comum" ou "administrador")
   - Valor padrão: "comum"

## 📋 Arquivos Criados

- `prisma/migrations/1_add_missing_usuario_fields/migration.sql` - Migration SQL
- `fix-usuario-schema.js` - Script para executar a migração (foi deletado após execução)

## ✅ Verificação

A migração foi executada com sucesso:
```
✓ CPF column added
✓ Telefone column added
✓ Endereco column added
✓ TipoUsuario column added/updated
✓ Default values set
✓ CPF unique index created
✓ Schema is working correctly
```

## 🎯 Próximos Passos

Agora você pode:
1. ✅ Criar nova conta em `/auth/signup`
2. ✅ Completar perfil em `/perfil`
3. ✅ Criar anúncios
4. ✅ Gerenciar loja

## 🔐 Notas de Segurança

Ainda há itens TODO de segurança:
- ⚠️ Passwords não estão sendo hasheadas com bcrypt
- ⚠️ Sem autenticação/JWT implementada

Recomenda-se implementar essas seguridades antes de deployar em produção.

## 📝 Resumo Técnico

| Campo | Tipo | Nullable | Padrão |
|-------|------|----------|--------|
| id | SERIAL | ❌ | AUTO_INCREMENT |
| nome | VARCHAR(255) | ❌ | - |
| email | VARCHAR(255) | ❌ | - (UNIQUE) |
| senha | VARCHAR(255) | ❌ | - |
| cpf | VARCHAR(11) | ✅ | NULL |
| telefone | VARCHAR(20) | ✅ | NULL |
| endereco | TEXT | ✅ | NULL |
| tipoUsuario | VARCHAR(255) | ✅ | 'comum' |
| dataCriacao | TIMESTAMP | ❌ | NOW() |
| dataAtualizacao | TIMESTAMP | ❌ | NOW() |

---

**Status**: 🟢 CORRIGIDO E FUNCIONANDO
