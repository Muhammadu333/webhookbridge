export const env = {
  port: Number(process.env.PORT ?? 4010),
  databaseUrl: process.env.DATABASE_URL ?? "",
  webhookSecret: process.env.WEBHOOK_SECRET ?? ""
};

