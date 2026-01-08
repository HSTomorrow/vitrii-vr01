# Migração: "Loja" → "Anunciante"

## ✅ Concluído

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Model `Loja` → `Anunciante`
   - Tabela `lojas` → `anunciantes`
   - `UsuarioLoja` → `UsuarioAnunciante`
   - Todos os campos `lojaId` → `anuncianteId`
   - Tabela `usuarios_lojas` → `usuarios_anunciantes`

2. **Database Migration** (`prisma/migrations/2_rename_loja_to_anunciante/migration.sql`)
   - Migration SQL criada com todos os ALTER TABLE

3. **Novo Arquivo de Rotas** (`server/routes/anunciantes.ts`)
   - Todas as funções renomeadas
   - Backward compatibility exports para nomes antigos

4. **Server Index** (`server/index.ts`)
   - Imports atualizados
   - Novas rotas `/api/anunciantes` criadas
   - Rotas `/api/lojas` mantidas para backward compatibility

5. **Prisma Client Gerado**
   - `npx prisma generate` executado com sucesso

## ⏳ Ainda Precisa (Busca e Substituição Necessária)

### Arquivos do Backend a Atualizar

Todos os arquivos abaixo precisam de:
- `lojaId` → `anuncianteId`
- `"Loja"` → `"Anunciante"` (em mensagens de erro)
- `.loja` → `.anunciante` (em relations)
- `tipoRemetente: ["usuario", "loja"]` → `tipoRemetente: ["usuario", "anunciante"]`

**Arquivos:**
- `server/routes/anuncios.ts`
- `server/routes/conversas.ts`
- `server/routes/mensagens.ts`
- `server/routes/agendas.ts`
- `server/routes/equipes-venda.ts`
- `server/routes/tabelas-preco.ts`
- `server/routes/grupos-productos.ts`
- `server/routes/productos.ts`
- `server/routes/favoritos.ts`

### Arquivos do Frontend a Atualizar

- `client/pages/*.tsx` - buscar "Loja" e renomear para "Anunciante"
- `client/components/*.tsx` - buscar "Loja" e renomear para "Anunciante"
- `client/**` - atualizar APIs que usam `/api/lojas` para `/api/anunciantes`

## 🚀 Próximos Passos

1. **Executar Migration no Banco:**
   ```bash
   npx prisma migrate resolve --applied rename_loja_to_anunciante
   npx prisma db push
   ```

2. **Atualizar Arquivos Backend:**
   - Use find & replace em cada arquivo listado acima
   - Teste cada mudança

3. **Atualizar Frontend:**
   - Buscar e substituir "Loja" → "Anunciante" em componentes
   - Atualizar chamadas de API `/api/lojas` → `/api/anunciantes`

4. **Testes:**
   - `npm run build`
   - Testar rotas `/api/anunciantes` e `/api/lojas` (backward compatibility)

## 💡 Notas

- Backward compatibility mantida: rotas `/api/lojas` ainda funcionam
- Arquivo `server/routes/lojas.ts` pode ser deletado depois
- Prisma schema já foi totalmente atualizado
- Todos os tipos TypeScript foram regenerados automaticamente
