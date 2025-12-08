/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // permite acessar pelo IP da rede local no dev
    allowedDevOrigins: ["http://192.168.1.62:3000"],
  },
}

export default nextConfig
