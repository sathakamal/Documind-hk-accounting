const { PrismaClient } = require('@prisma/client');
const { PrismaNeonHttp } = require('@prisma/adapter-neon');

// Prisma v7: PrismaNeonHttp takes connectionString directly
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eujMs7amq1RO@ep-blue-base-aobgm80s.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
const pc = new PrismaClient({ adapter });

console.log('PrismaClient created with Neon HTTP adapter');

pc.user.findFirst()
  .then(u => {
    if (u) {
      console.log('✅ DB OK - user:', u.email, 'hash length:', u.password?.length);
    } else {
      console.log('✅ DB OK - no users found (need to seed)');
    }
    return pc.$disconnect();
  })
  .catch(e => console.error('❌ FAIL:', e.message));
