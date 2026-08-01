import type { Metadata } from "next";
import { TheoryCollectionPage } from "@/components/site/TheoryCollectionPage";
import { getTheoryPart } from "@/lib/theory-parts";

export const metadata: Metadata = { title: "FUTURE — Life Mirror Theory", description: "Life Mirror Theory 的 FUTURE 研究部分。" };
export default function FuturePage() { return <TheoryCollectionPage part={getTheoryPart("future")!} />; }
