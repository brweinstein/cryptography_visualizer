/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true
  },
  async headers() {
    return [
      {
        source: '/pkg/:path*.wasm',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' }
        ]
      },
      {
        source: '/pkg/:path*.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' }
        ]
      },
      {
        source: '/pkg/:path*.mjs',
        headers: [
          { key: 'Content-Type', value: 'application/javascript' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
