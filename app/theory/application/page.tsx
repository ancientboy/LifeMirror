import type { Metadata } from "next";
import { TheoryCollectionPage } from "@/components/site/TheoryCollectionPage";
import { getTheoryPart } from "@/lib/theory-parts";

export const metadata: Metadata = { title: "APPLICATION — Life Mirror Theory", description: "Life Mirror Theory 的 APPLICATION 研究部分：体验、关系与经济。" };
export default function ApplicationPage() { return <TheoryCollectionPage part={getTheoryPart("application")!} />; }
