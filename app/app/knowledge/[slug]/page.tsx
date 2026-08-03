import { notFound } from "next/navigation";
import { KnowledgePackExperience } from "@/components/app/KnowledgePackExperience";
import { getKnowledgePack, KNOWLEDGE_PACKS } from "@/lib/knowledge-packs";

export function generateStaticParams() {
  return KNOWLEDGE_PACKS.map((pack) => ({ slug: pack.id }));
}

export default async function KnowledgePackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = getKnowledgePack(slug);
  if (!pack) notFound();
  return <KnowledgePackExperience pack={pack} />;
}
