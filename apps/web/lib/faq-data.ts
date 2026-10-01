import { getFaqs } from "./google-sheets";

export interface FaqEntry {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  sortOrder: number;
}

export async function getFaqEntries(): Promise<FaqEntry[]> {
  try {
    return await getFaqs();
  } catch {
    return [];
  }
}
