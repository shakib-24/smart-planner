export interface WbsTemplate {
  id: string;
  nameKey: string;
  subtasks: Record<"en" | "ja" | "bn", { title: string; weight: number }[]>;
}

export const WBS_TEMPLATES: WbsTemplate[] = [
  {
    id: "certification-study",
    nameKey: "templateCertificationStudy",
    subtasks: {
      en: [
        { title: "Read study materials", weight: 3 },
        { title: "Practice problems", weight: 3 },
        { title: "Take mock exam", weight: 2 },
        { title: "Review weak areas", weight: 2 },
        { title: "Final review", weight: 1 },
      ],
      ja: [
        { title: "教材を読む", weight: 3 },
        { title: "問題演習", weight: 3 },
        { title: "模擬試験を受ける", weight: 2 },
        { title: "苦手分野の復習", weight: 2 },
        { title: "最終復習", weight: 1 },
      ],
      bn: [
        { title: "Read study materials", weight: 3 },
        { title: "Solve practice problems", weight: 3 },
        { title: "Take mock exam", weight: 2 },
        { title: "Review weak areas", weight: 2 },
        { title: "Final review", weight: 1 },
      ],
    },
  },
  {
    id: "feature-development",
    nameKey: "templateFeatureDevelopment",
    subtasks: {
      en: [
        { title: "Design", weight: 2 },
        { title: "Implement", weight: 4 },
        { title: "Write tests", weight: 2 },
        { title: "Code review", weight: 1 },
        { title: "Deploy", weight: 1 },
      ],
      ja: [
        { title: "設計", weight: 2 },
        { title: "実装", weight: 4 },
        { title: "テスト作成", weight: 2 },
        { title: "コードレビュー", weight: 1 },
        { title: "デプロイ", weight: 1 },
      ],
      bn: [
        { title: "Design", weight: 2 },
        { title: "Implement", weight: 4 },
        { title: "Write tests", weight: 2 },
        { title: "Code review", weight: 1 },
        { title: "Deploy", weight: 1 },
      ],
    },
  },
  {
    id: "software-project",
    nameKey: "templateSoftwareProject",
    subtasks: {
      en: [
        { title: "Design", weight: 2 },
        { title: "Frontend", weight: 3 },
        { title: "Backend", weight: 3 },
        { title: "Testing", weight: 2 },
        { title: "Deploy", weight: 1 },
      ],
      ja: [
        { title: "設計", weight: 2 },
        { title: "フロントエンド", weight: 3 },
        { title: "バックエンド", weight: 3 },
        { title: "テスト", weight: 2 },
        { title: "デプロイ", weight: 1 },
      ],
      bn: [
        { title: "Design", weight: 2 },
        { title: "Frontend", weight: 3 },
        { title: "Backend", weight: 3 },
        { title: "Testing", weight: 2 },
        { title: "Deploy", weight: 1 },
      ],
    },
  },
];
