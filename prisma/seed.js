'use strict';
// Idempotent seed: roles, governorates, and (optionally) admin + verifier accounts.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createPasswordService } = require('../src/modules/auth/services/password.service');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function upsertUser(email, fullName, password, roleName, passwords) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, full_name: fullName, password_hash: await passwords.hash(password) },
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: user.id, role_id: role.id } },
    update: {},
    create: { user_id: user.id, role_id: role.id },
  });
}

async function main() {
  for (const [id, name] of [[1n, 'ADMIN'], [2n, 'EDITOR'], [3n, 'VERIFIER']]) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { id, name } });
  }
  for (const [name_ar, name_en] of [['قلقيلية', 'Qalqilya'], ['نابلس', 'Nablus'], ['رام الله والبيرة', 'Ramallah and al-Bireh'], ['الخليل', 'Hebron'], ['جنين', 'Jenin'], ['طولكرم', 'Tulkarm'], ['سلفيت', 'Salfit'], ['بيت لحم', 'Bethlehem'], ['القدس', 'Jerusalem'], ['أريحا والأغوار', 'Jericho and Jordan Valley'], ['طوباس', 'Tubas']]) {
    await prisma.governorate.upsert({ where: { name_ar }, update: {}, create: { name_ar, name_en } });
  }
  // Demo accounts are created ONLY when passwords are supplied via the environment.
  const passwords = createPasswordService();
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await upsertUser(process.env.SEED_ADMIN_EMAIL, 'Seed Admin', process.env.SEED_ADMIN_PASSWORD, 'ADMIN', passwords);
  }
  if (process.env.SEED_VERIFIER_EMAIL && process.env.SEED_VERIFIER_PASSWORD) {
    await upsertUser(process.env.SEED_VERIFIER_EMAIL, 'Seed Verifier', process.env.SEED_VERIFIER_PASSWORD, 'VERIFIER', passwords);
  }
  console.log('Seed complete');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
