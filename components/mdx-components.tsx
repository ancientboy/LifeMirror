import type { MDXComponents } from "mdx/types";
import type { ComponentType, ReactNode } from "react";
import {
  HumanUnderstandingFuture,
  HumanMirrorFramework,
  LifeTimeline,
  MirrorDNA,
  MirrorEngine,
  MirrorEconomyModel,
  MirrorEquation,
  MirrorEvolution,
  MirrorExperienceFramework,
  MirrorExperienceLoop,
  MirrorGraph,
  MirrorMoment,
  PrincipleCards,
  RelationshipMirror,
  TheorySystemBridge,
} from "@/components/theory";

type FallbackProps = { children?: ReactNode };

function TheoryComponentFallback({ name, children }: FallbackProps & { name: string }) {
  return (
    <aside className="theory-component-fallback" role="note">
      <small>THEORY COMPONENT · FALLBACK</small>
      <strong>{name}</strong>
      <p>该理论模型正在演化中，正文内容仍可正常阅读。</p>
      {children}
    </aside>
  );
}

export const mdxComponents: MDXComponents = {
  HumanMirrorFramework,
  HumanUnderstandingFuture,
  MirrorEquation,
  MirrorEvolution,
  MirrorExperienceFramework,
  MirrorExperienceLoop,
  MirrorGraph,
  MirrorMoment,
  MirrorDNA,
  MirrorEngine,
  MirrorEconomyModel,
  PrincipleCards,
  RelationshipMirror,
  TheorySystemBridge,
  LifeTimeline,
  img: ({ src = "", alt = "", ...props }) => {
    const resolvedSrc = typeof src === "string" && src.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}`
      : src;
    return <img src={resolvedSrc} alt={alt} loading="lazy" {...props} />;
  },
};

const componentPattern = /<([A-Z][A-Za-z0-9]*)\b/g;

export function getMdxComponents(source: string): MDXComponents {
  const components: MDXComponents = { ...mdxComponents };
  for (const match of source.matchAll(componentPattern)) {
    const name = match[1];
    if (components[name]) continue;
    components[name] = ((props: FallbackProps) => (
      <TheoryComponentFallback name={name} {...props} />
    )) as ComponentType<FallbackProps>;
  }
  return components;
}
