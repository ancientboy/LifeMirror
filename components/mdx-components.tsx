import type { MDXComponents } from "mdx/types";
import {
  HumanMirrorFramework,
  LifeTimeline,
  MirrorDNA,
  MirrorEquation,
  MirrorEvolution,
  MirrorGraph,
  PrincipleCards,
} from "@/components/theory";

export const mdxComponents: MDXComponents = {
  HumanMirrorFramework,
  MirrorEquation,
  MirrorEvolution,
  MirrorGraph,
  MirrorDNA,
  PrincipleCards,
  LifeTimeline,
  img: ({ src = "", alt = "", ...props }) => {
    const resolvedSrc = typeof src === "string" && src.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}`
      : src;
    return <img src={resolvedSrc} alt={alt} loading="lazy" {...props} />;
  },
};
