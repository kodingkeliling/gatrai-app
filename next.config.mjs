/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    transpilePackages: ["@untitledui/icons", "@modelcontextprotocol/sdk"],
};

export default nextConfig;
