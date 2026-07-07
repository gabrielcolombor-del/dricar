const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  if (!action) {
    console.log(`
Uso do Gerenciador de Usuários:
  Listar usuários:
    node scripts/manage-users.js list

  Criar um usuário:
    node scripts/manage-users.js create <email> <senha> <nome> <cargo: admin|manager|seller>

  Alterar a senha de um usuário:
    node scripts/manage-users.js password <email> <nova_senha>

  Excluir um usuário:
    node scripts/manage-users.js delete <email>
`);
    return;
  }

  if (action === "list") {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log("\n--- Usuários Cadastrados ---");
    users.forEach((u) => {
      console.log(`Nome: ${u.name} | E-mail: ${u.email} | Cargo: ${u.role}`);
    });
    console.log("----------------------------\n");
  } else if (action === "create") {
    const [_, email, password, name, role] = args;
    if (!email || !password || !name || !role) {
      console.error("Erro: E-mail, senha, nome e cargo são obrigatórios.");
      return;
    }

    const validRoles = ["admin", "manager", "seller"];
    if (!validRoles.includes(role.toLowerCase())) {
      console.error("Erro: Cargo inválido. Deve ser admin, manager ou seller.");
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error(`Erro: Já existe um usuário com o e-mail ${email}.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        role: role.toLowerCase(),
      },
    });

    console.log(`Usuário ${newUser.name} (${newUser.email}) criado com sucesso como ${newUser.role}!`);
  } else if (action === "password") {
    const [_, email, newPassword] = args;
    if (!email || !newPassword) {
      console.error("Erro: E-mail e nova senha são obrigatórios.");
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Erro: Usuário com e-mail ${email} não encontrado.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`Senha do usuário ${user.name} atualizada com sucesso!`);
  } else if (action === "delete") {
    const [_, email] = args;
    if (!email) {
      console.error("Erro: E-mail é obrigatório.");
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Erro: Usuário com e-mail ${email} não encontrado.`);
      return;
    }

    await prisma.user.delete({ where: { email } });
    console.log(`Usuário ${user.name} (${user.email}) removido com sucesso!`);
  } else {
    console.error("Ação desconhecida:", action);
  }
}

main()
  .catch((e) => {
    console.error("Erro ao executar script:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
