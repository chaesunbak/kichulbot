import { cache } from "react";
import { api } from "./api";
import { getToken } from "./auth";

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

export interface Paper {
  id: string;
  title: string;
  year: number;
  questionCount: number;
  exam: Taxonomy;
  subject: Taxonomy;
}

export const getPapers = cache(async (): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { papers: Paper[] } }>("/papers", token);
  return res.data.papers;
});
