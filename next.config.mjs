const nextConfig = {
  experimental: {
    allowedDevOrigins: ["http://192.168.1.62:3000"]
  },
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }]
  }
}
export default nextConfig

