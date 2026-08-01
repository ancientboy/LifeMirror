import type { Metadata } from "next";
import { TheoryCollectionPage } from "@/components/site/TheoryCollectionPage";
import { getTheoryPart } from "@/lib/theory-parts";

export const metadata: Metadata = { title: "WHAT — Life Mirror Theory", description: "Life Mirror Theory 的 WHAT 研究部分。" };
export default function WhatPage() { return <TheoryCollectionPage part={getTheoryPart("what")!} />; }
