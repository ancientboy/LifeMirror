import type { InteractionMode, MirrorToolContext, MirrorToolDefinition, ToolExecutionResult, ToolPermission } from "./types.js";

export class ToolRegistry {
  private readonly tools = new Map<string, MirrorToolDefinition<any, any>>();

  register<TInput, TOutput>(tool: MirrorToolDefinition<TInput, TOutput>): void {
    if (this.tools.has(tool.id)) throw new Error(`Tool ${tool.id} is already registered`);
    this.tools.set(tool.id, tool);
  }

  get(id: string): MirrorToolDefinition | undefined { return this.tools.get(id); }

  list(mode?: InteractionMode): MirrorToolDefinition[] {
    return [...this.tools.values()].filter((tool) => !mode || tool.supportedModes.includes(mode));
  }
}

function permissionAllowed(permission: ToolPermission, context: MirrorToolContext): boolean {
  if (permission === "public") return true;
  if (permission === "authenticated") return Boolean(context.userId);
  return Boolean(context.userId && context.consentedPermissions?.includes("sensitive"));
}

export async function executeTool<T>(registry: ToolRegistry, toolId: string, input: unknown, context: MirrorToolContext): Promise<ToolExecutionResult<T>> {
  const tool = registry.get(toolId);
  if (!tool) throw new Error(`Tool ${toolId} is not registered`);
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const finish = (status: ToolExecutionResult["trace"]["status"], errorCode?: string): ToolExecutionResult<T>["trace"] => {
    const finished = Date.now();
    return { toolId: tool.id, toolVersion: tool.version, status, startedAt, finishedAt: new Date(finished).toISOString(), durationMs: Math.max(0, finished - started), permission: tool.permission, risk: tool.risk, ...(errorCode ? { errorCode } : {}) };
  };
  if (!tool.supportedModes.includes(context.mode)) return { trace: finish("denied", "mode_not_supported") };
  if (!permissionAllowed(tool.permission, context)) return { trace: finish("denied", "permission_denied") };

  let validated: unknown;
  try { validated = tool.validate(input); }
  catch { return { trace: finish("failed", "invalid_input") }; }

  const timeoutMs = tool.timeoutMs ?? 10_000;
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("tool_timeout")), timeoutMs); });
    const output = await Promise.race([tool.execute(validated, context), timeout]) as T;
    return { output, trace: finish("succeeded") };
  } catch (error) {
    const timedOut = error instanceof Error && error.message === "tool_timeout";
    return { trace: finish(timedOut ? "timed_out" : "failed", timedOut ? "timeout" : "execution_failed") };
  } finally { if (timer) clearTimeout(timer); }
}
