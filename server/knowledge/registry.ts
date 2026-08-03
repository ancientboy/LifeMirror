import { knowledgePackSchema } from "./schema.js";
import type { KnowledgePack } from "./types.js";

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.split("-")[0].split(".").map(Number);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return left.localeCompare(right);
}

export class KnowledgePackRegistry {
  private readonly packs = new Map<string, Map<string, KnowledgePack>>();

  register(input: unknown): KnowledgePack {
    const pack = knowledgePackSchema.parse(input) as KnowledgePack;
    const versions = this.packs.get(pack.id) ?? new Map<string, KnowledgePack>();
    if (versions.has(pack.version)) throw new Error(`Knowledge pack ${pack.id}@${pack.version} is already registered`);
    versions.set(pack.version, structuredClone(pack));
    this.packs.set(pack.id, versions);
    return structuredClone(pack);
  }

  get(id: string, version?: string): KnowledgePack | undefined {
    const versions = this.packs.get(id);
    if (!versions) return undefined;
    const selected = version
      ? versions.get(version)
      : [...versions.values()].filter((pack) => pack.status === "active").sort((a, b) => compareVersions(b.version, a.version))[0];
    return selected ? structuredClone(selected) : undefined;
  }

  setStatus(id: string, version: string, status: KnowledgePack["status"]): KnowledgePack {
    const pack = this.packs.get(id)?.get(version);
    if (!pack) throw new Error(`Knowledge pack ${id}@${version} is not registered`);
    pack.status = status;
    return structuredClone(pack);
  }

  list(options: { includeDisabled?: boolean } = {}): KnowledgePack[] {
    return [...this.packs.values()]
      .flatMap((versions) => [...versions.values()])
      .filter((pack) => options.includeDisabled || pack.status === "active")
      .sort((a, b) => a.id.localeCompare(b.id) || compareVersions(b.version, a.version))
      .map((pack) => structuredClone(pack));
  }
}
