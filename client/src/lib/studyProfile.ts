import { normalizeStudyStudentNumber } from "@shared/study";

const STUDY_PROFILE_KEY = "pmam-study-profile-v1";

export type StudyProfile = {
  studentNumber: string;
  accessToken: string;
};

export function normalizeStudentNumber(value: string) {
  return normalizeStudyStudentNumber(value);
}

export function getStudyProfile(): StudyProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STUDY_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyProfile;
    if (!parsed?.studentNumber) return null;
    return {
      studentNumber: normalizeStudentNumber(parsed.studentNumber),
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken.trim() : "",
    };
  } catch {
    return null;
  }
}

export function saveStudyProfile(studentNumber: string, accessToken: string) {
  if (typeof window === "undefined") return null;
  const normalized = normalizeStudentNumber(studentNumber);
  const normalizedAccessToken = accessToken.trim();
  const profile = normalized && normalizedAccessToken
    ? { studentNumber: normalized, accessToken: normalizedAccessToken }
    : null;

  if (profile) {
    window.localStorage.setItem(STUDY_PROFILE_KEY, JSON.stringify(profile));
  }

  return profile;
}

export function clearStudyProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDY_PROFILE_KEY);
}
