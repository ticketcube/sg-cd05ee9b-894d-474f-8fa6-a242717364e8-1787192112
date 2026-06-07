/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://ticketcube.org/otw',
        permanent: true, // 301 redirect
        basePath: false
      }
    ];
  },
  // Disable all unnecessary features for minimal build
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Minimize build size
  swcMinify: true,
  // No image optimization needed
  images: {
    unoptimized: true
  }
};

export default nextConfig;