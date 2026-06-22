/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/code',
  // Emit each route as a directory (coaster/index.html) so direct links and
  // hard refreshes resolve correctly on GitHub Pages.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
