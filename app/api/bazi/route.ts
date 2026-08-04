import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateBazi } from "@/server/tools/bazi/engine";

const inputSchema = z.object({
  year: z.number().int().min(1900).max(2100), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).nullable(), minute: z.number().int().min(0).max(59),
  utcOffsetMinutes: z.number().int().min(-720).max(840), dayBoundary: z.enum(["midnight", "late-zi"]),
  longitude: z.number().min(-180).max(180).nullable().optional(), useTrueSolarTime: z.boolean().optional(),
  luckGender: z.enum(["male", "female"]).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    return NextResponse.json({ result: calculateBazi(input) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法计算命盘";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
