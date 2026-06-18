export type AttemptQuestionRevisionRecord = {
  question?: {
    tags?: Array<{
      tag: {
        id: string;
        name: string;
        keywords: string[];
        sortOrder: number;
        tagGroup: {
          id: string;
          examId: string;
          name: string;
          selectionMode: 'SINGLE' | 'MULTIPLE';
          sortOrder: number;
          isActive: boolean;
        } | null;
      };
    }>;
  };
};
