export type VocabularyItem = {
  word: string;
  meaning: string;
  example: string;
};

export type TutorReply = {
  grammar: string[];
  vocabulary: VocabularyItem[];
  natural_expression: string[];
  fluency_score: number;
  suggested_response: string;
  follow_up_question: string;
  coaching_plan: {
    what_to_fix: string[];
    what_to_practice_next: string;
    targeted_drills: string[];
  };
  micro_practice: {
    sentence: string;
    instruction: string;
  };
  focus_training: {
    weakness: "grammar issue" | "vocabulary limitation" | "sentence structure";
    next_question: string;
  };
};

export type PracticeAttempt = {
  id: string;
  attemptNumber: number;
  transcript: string;
  feedback: TutorReply;
  createdAt: string;
};

export type LearningMemory = {
  grammarErrors: Record<string, number>;
  overusedWords: Record<string, number>;
  weakStructures: Record<string, number>;
  weakAreas: Record<string, number>;
  sessions: {
    date: string;
    issueCount: number;
    fluencyScore: number;
  }[];
  lastUpdated: string;
};

export type NotebookEntry = VocabularyItem & {
  id: string;
  createdAt: string;
};
