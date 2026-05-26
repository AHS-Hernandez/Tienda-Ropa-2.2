/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["mssql", "tedious"],
  async redirects() {
    return [
      {
        source: "/tienda",
        destination: "/cliente/home",
        permanent: true,
      },
      {
        source: "/tienda/:path*",
        destination: "/cliente/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
