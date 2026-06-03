import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid Postgres connection URL"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  DEMO_ADMIN_ENABLED: z.enum(["true", "false"]).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

export function getServerEnv() {
  return envSchema.parse(process.env);
}

export function checkServerEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    } as const;
  }

  return {
    ok: true,
    values: {
      DATABASE_URL: "present",
      BLOB_READ_WRITE_TOKEN: parsed.data.BLOB_READ_WRITE_TOKEN ? "present" : "missing_optional",
      DEMO_ADMIN_ENABLED: parsed.data.DEMO_ADMIN_ENABLED ?? "false",
      OPENAI_API_KEY: parsed.data.OPENAI_API_KEY ? "present" : "missing_optional",
      OPENAI_MODEL: parsed.data.OPENAI_MODEL ?? "gpt-4.1-mini",
      VERCEL_ENV: parsed.data.VERCEL_ENV ?? "local",
    },
  } as const;
}
