/** @type {import('next').NextConfig} */
const nextConfig = {
  // permite acesso via rede local no dev
  allowedDevOrigins: ['192.168.1.62'],

  // opcional: silencia o aviso do Turbopack sobre raiz do workspace
  turbopack: {
    root: process.cwd(),
  },

  async redirects() {
    return [{ source: '/', destination: '/login', permanent: false }];
  },
};

export default nextConfig;
