/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/LifeMirror" : "",
  assetPrefix: isGitHubPages ? "/LifeMirror/" : "",
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/LifeMirror" : "" },
  webpack(config) {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
