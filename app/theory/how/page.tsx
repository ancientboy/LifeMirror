import type { Metadata } from "next";
import { TheoryCollectionPage } from "@/components/site/TheoryCollectionPage";
import { getTheoryPart } from "@/lib/theory-parts";

export const metadata: Metadata = { title: "HOW — Life Mirror Theory", description: "Life Mirror Theory 的 HOW 研究部分：原则、DNA、Graph 与 Engine。" };
export default function HowPage() { return <TheoryCollectionPage part={getTheoryPart("how")!} />; }
