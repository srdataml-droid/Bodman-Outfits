/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.100.4"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

module.exports = nextConfig;
