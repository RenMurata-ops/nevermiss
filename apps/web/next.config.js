/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile internal packages
  transpilePackages: [
    "@nevermiss/ui",
    "@nevermiss/core",
    "@nevermiss/supabase",
  ],

  // Strict mode for development
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
