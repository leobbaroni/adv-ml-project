/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The monorepo workspace packages need to be transpiled by Next.
  transpilePackages: ['@app/db', '@app/ical', '@app/ai', '@app/shared'],
  experimental: {
    // Server actions are on by default in Next 15; we just keep the option visible.
  },
};

export default nextConfig;
