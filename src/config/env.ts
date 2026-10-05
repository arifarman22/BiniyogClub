export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "Biniyog Club <onboarding@resend.dev>",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
