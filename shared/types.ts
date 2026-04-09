/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  password?: string | null;
  loginMethod: string | null;
  role: 'user' | 'admin' | 'master';
  createdAt: Date | string;
  updatedAt: Date | string;
  lastSignedIn: Date | string | null;
}

export interface Hymn {
  id: number;
  number: number;
  title: string;
  subtitle: string | null;
  author: string | null;
  composer: string | null;
  category: 'nacional' | 'militar' | 'pmam' | 'arma' | 'oracao';
  collection?: string | null;
  lyrics: string;
  description: string | null;
  youtubeUrl: string | null;
  audioUrl: string | null;
  lyricsSync?: Array<{ time: number; text: string }> | null;
  isActive: boolean;
  likesCount: number;
  viewsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CfapMission {
  id: number;
  title: string;
  content: string;
  priority: 'normal' | 'urgente' | 'critica';
  status: 'ativa' | 'cumprida' | 'inativa';
  dueDate: string | null;
  isActive: boolean;
  authorId: number | null;
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
  visitorReacted?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicComment {
  id: number;
  targetType: 'hymn' | 'mission';
  targetId: number;
  authorName: string;
  content: string;
  createdAt: Date | string;
}

export interface StudyStudent {
  id: number;
  studentNumber: string;
  displayName: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastActiveAt: Date | string;
}

export interface StudyModuleProgressRecord {
  moduleSlug: string;
  completedSectionIds: string[];
  answers: Record<string, string | string[] | null>;
  lastScore: number | null;
  bestScore: number | null;
  lastSubmittedAt: string | null;
  updatedAt: Date | string | null;
}

export interface StudyDashboard {
  student: StudyStudent;
  modules: StudyModuleProgressRecord[];
}

export * from "./_core/errors";
