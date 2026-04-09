const STUDY_PROFILE_KEY = "pmam-study-profile-v1";

export type StudyProfile = {
  studentNumber: string;
};

export function normalizeStudentNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function getStudyProfile(): StudyProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STUDY_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudyProfile;
    if (!parsed?.studentNumber) return null;
    return { studentNumber: normalizeStudentNumber(parsed.studentNumber) };
  } catch {
    return null;
  }
}

export function saveStudyProfile(studentNumber: string) {
  if (typeof window === "undefined") return null;
  const normalized = normalizeStudentNumber(studentNumber);
  const profile = normalized ? { studentNumber: normalized } : null;

  if (profile) {
    window.localStorage.setItem(STUDY_PROFILE_KEY, JSON.stringify(profile));
  }

  return profile;
}

export function clearStudyProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STUDY_PROFILE_KEY);
}
