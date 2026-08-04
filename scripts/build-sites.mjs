import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

const worker = `
function indexPath(pathname) {
  if (pathname.endsWith("/")) return pathname + "index.html";
  if (!pathname.split("/").pop()?.includes(".")) return pathname + "/index.html";
  return pathname;
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;

    const url = new URL(request.url);
    url.pathname = indexPath(url.pathname);
    return env.ASSETS.fetch(new Request(url, request));
  },
};
`;

await writeFile("dist/server/index.js", worker.trimStart());
