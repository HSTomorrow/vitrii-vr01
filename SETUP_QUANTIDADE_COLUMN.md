# 🚀 Guide Rápido: Adicionar Coluna `quantidade` ao Supabase

## Passo 1: Abrir Supabase Dashboard
1. Vá para https://app.supabase.com
2. Selecione seu projeto Vitrii

## Passo 2: Abrir SQL Editor
- Clique em **"SQL Editor"** no menu esquerdo
- Clique em **"New Query"**

## Passo 3: Executar o Comando SQL
Copie e cole este comando no editor:

```sql
ALTER TABLE anuncios ADD COLUMN quantidade INT DEFAULT 1;
```

Depois clique em **"▶ Run"** (ou Ctrl+Enter)

## Passo 4: Verificar se deu certo
Você verá uma mensagem de sucesso tipo:
```
Query: executed successfully
```

## Passo 5: Volta aqui!
Após adicionar a coluna, volte para a conversa e me avise que está pronto.

---

## ❓ Se der erro "column already exists"
Significa que a coluna já existe no banco. Nesse caso, é seguro ignorar e continuar.

## ❓ Se der outro erro
- Screenshot do erro
- Me mostre qual é o mensagem de erro exata
- Vou ajudar a resolver

---

**Próximo passo após adicionar:** Vou criar:
- **A)** Painel de Gerenciamento de Reservas
- **B)** Sistema de Notificações
- **C)** Testes funcionais

Quando terminar, me avisa! 🎯
