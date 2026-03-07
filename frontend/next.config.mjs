/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_BACKEND_WS_URL:
      process.env.NEXT_PUBLIC_BACKEND_WS_URL || "ws://localhost:8000/ws/session",
  },
};

export default nextConfig;
