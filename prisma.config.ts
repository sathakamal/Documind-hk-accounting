import { defineConfig } from "prisma/config";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrate: {
    async adapter(env) {
      // Used only for migrations — routes over HTTPS (port 443)
      return new PrismaNeonHttp(env.DATABASE_URL!);
    },
  },
});
