export type DataPaperDefinition = {
  id: string;
  slug: string;
  navTitle: string;
  filename: string;
  summary: string;
};

export const dataPaperDefinitions: DataPaperDefinition[] = [
  {
    id: "DATA-001",
    slug: "personal-mirror-data-specification",
    navTitle: "Personal Mirror Data Specification",
    filename: "DATA-001-personal-mirror-data-specification.mdx",
    summary: "定义 Life Mirror 如何存储、处理、保护和治理个人镜像数据。",
  },
];
