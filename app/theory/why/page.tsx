import type { Metadata } from "next";
import { TheoryCollectionPage } from "@/components/site/TheoryCollectionPage";
import { getTheoryPart } from "@/lib/theory-parts";

export const metadata: Metadata = { title: "WHY — Life Mirror Theory", description: "Life Mirror Theory 的 WHY 研究部分。" };
export default function WhyPage() { return <TheoryCollectionPage part={getTheoryPart("why")!} />; }
