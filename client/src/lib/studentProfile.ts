import { getStudentSession } from "@/lib/studentSession";

const PROFILE_KEY_PREFIX = "pmam-student-profile-v1:";

export type StudentProfile = {
  fullName: string;
  nomeGuerra: string;
  rg: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  bloodType: string;
  emergencyContact: string;
  emergencyPhone: string;
  photoDataUrl: string;
};

export const emptyStudentProfile: StudentProfile = {
  fullName: "",
  nomeGuerra: "",
  rg: "",
  cpf: "",
  phone: "",
  email: "",
  address: "",
  birthDate: "",
  bloodType: "",
  emergencyContact: "",
  emergencyPhone: "",
  photoDataUrl: "",
};

function getProfileKey() {
  const session = getStudentSession();
  return session ? `${PROFILE_KEY_PREFIX}${session.id}` : null;
}

export function getStudentProfile(): StudentProfile {
  if (typeof window === "undefined") return emptyStudentProfile;

  const key = getProfileKey();
  if (!key) return emptyStudentProfile;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...emptyStudentProfile, ...JSON.parse(raw) } : emptyStudentProfile;
  } catch {
    return emptyStudentProfile;
  }
}

export function saveStudentProfile(profile: StudentProfile) {
  if (typeof window === "undefined") return;

  const key = getProfileKey();
  if (!key) return;

  window.localStorage.setItem(key, JSON.stringify(profile));
}
