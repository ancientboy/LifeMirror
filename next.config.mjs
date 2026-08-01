/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/LifeMirror" : "",
  assetPrefix: isGitHubPages ? "/LifeMirror/" : "",
  env: { NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/LifeMirror" : "" },
};

export default nextConfig;
