import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FUNCIONALIDADES = [
  // User Management
  {
    chave: "MANAGE_USERS",
    nome: "Gerenciar Usuários",
    descricao: "Criar, editar, deletar usuários",
    categoria: "users",
  },
  {
    chave: "VIEW_USERS",
    nome: "Visualizar Usuários",
    descricao: "Visualizar lista de usuários e detalhes",
    categoria: "users",
  },
  {
    chave: "MANAGE_USER_PERMISSIONS",
    nome: "Gerenciar Permissões de Usuários",
    descricao: "Atribuir e remover funcionalidades de usuários",
    categoria: "users",
  },

  // Ads Management
  {
    chave: "MANAGE_ADS",
    nome: "Gerenciar Anúncios",
    descricao: "Criar, editar, deletar anúncios",
    categoria: "ads",
  },
  {
    chave: "VIEW_ALL_ADS",
    nome: "Visualizar Todos os Anúncios",
    descricao: "Visualizar anúncios de todas as lojas",
    categoria: "ads",
  },
  {
    chave: "MANAGE_FEATURED_ADS",
    nome: "Gerenciar Anúncios em Destaque",
    descricao: "Marcar anúncios como em destaque",
    categoria: "ads",
  },

  // Store Management
  {
    chave: "MANAGE_STORES",
    nome: "Gerenciar Lojas",
    descricao: "Criar, editar, deletar lojas",
    categoria: "stores",
  },
  {
    chave: "VIEW_ALL_STORES",
    nome: "Visualizar Todas as Lojas",
    descricao: "Visualizar todas as lojas do sistema",
    categoria: "stores",
  },

  // Chat Management
  {
    chave: "MANAGE_CHATS",
    nome: "Gerenciar Conversas",
    descricao: "Visualizar e gerenciar todas as conversas",
    categoria: "chat",
  },
  {
    chave: "VIEW_ALL_CHATS",
    nome: "Visualizar Todas as Conversas",
    descricao: "Visualizar conversas de todos os usuários",
    categoria: "chat",
  },

  // Payment Management
  {
    chave: "MANAGE_PAYMENTS",
    nome: "Gerenciar Pagamentos",
    descricao: "Visualizar e gerenciar pagamentos",
    categoria: "payments",
  },
  {
    chave: "VIEW_PAYMENT_REPORTS",
    nome: "Visualizar Relatórios de Pagamento",
    descricao: "Visualizar relatórios de pagamentos",
    categoria: "payments",
  },

  // Reports
  {
    chave: "VIEW_REPORTS",
    nome: "Visualizar Relatórios",
    descricao: "Acessar relatórios gerais do sistema",
    categoria: "reports",
  },
  {
    chave: "MANAGE_SITE",
    nome: "Gerenciar Site",
    descricao: "Acesso total ao site e configurações",
    categoria: "reports",
  },
];

async function main() {
  console.log("🔄 Starting RBAC setup...\n");

  try {
    // Check if funcionalidades table exists and is empty
    const existingFuncionalidades = await prisma.funcionalidade.findMany();

    if (existingFuncionalidades.length === 0) {
      console.log(
        "📝 Creating initial funcionalidades (features/permissions)...",
      );

      for (const func of FUNCIONALIDADES) {
        const created = await prisma.funcionalidade.create({
          data: func,
        });
        console.log(`   ✓ Created: ${created.chave} - ${created.nome}`);
      }

      console.log(
        `\n✅ Successfully created ${FUNCIONALIDADES.length} funcionalidades\n`,
      );
    } else {
      console.log(
        `ℹ️  Funcionalidades already exist (${existingFuncionalidades.length} found)\n`,
      );
    }

    // Grant all permissions to any existing ADM users
    const admUsers = await prisma.usuario.findMany({
      where: { tipoUsuario: "adm" },
    });

    if (admUsers.length > 0) {
      console.log(
        `🔑 Granting all funcionalidades to ${admUsers.length} ADM user(s)...`,
      );

      for (const user of admUsers) {
        // Get all funcionalidades
        const allFuncionalidades = await prisma.funcionalidade.findMany();

        // Grant each funcionalidade to the ADM user if not already granted
        for (const func of allFuncionalidades) {
          const existing = await prisma.usuarioXFuncionalidade.findUnique({
            where: {
              usuarioId_funcionalidadeId: {
                usuarioId: user.id,
                funcionalidadeId: func.id,
              },
            },
          });

          if (!existing) {
            await prisma.usuarioXFuncionalidade.create({
              data: {
                usuarioId: user.id,
                funcionalidadeId: func.id,
              },
            });
          }
        }

        console.log(`   ✓ All permissions granted to user: ${user.email}`);
      }
    }

    console.log("\n✅ RBAC setup completed successfully!\n");
  } catch (error) {
    console.error("❌ Error during RBAC setup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
