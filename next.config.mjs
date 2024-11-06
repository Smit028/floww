/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true, // Enables the app directory
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  
  webpack(config) {
    config.module.rules.push({
      test: /\.mp3$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[hash].[ext]',
          outputPath: 'static/audio/',
          publicPath: '/_next/static/audio/',
        },
      },
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: "http://localhost:3000/socket.io/:path*", // Proxy /socket.io to port 5000
      },
    ];
  },
};

export default nextConfig;
