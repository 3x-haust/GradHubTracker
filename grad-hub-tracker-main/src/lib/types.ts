export type AttendanceLevel = "상" | "중" | "하";
export type Gender = "남" | "여";
export type DesiredField = "제조" | "사무" | "피부미용" | "간호" | "보안" | "서비스" | "기타";
export type StatusOption = "구직중" | "교육중" | "재학중" | "재직중" | "군복무";

export interface EmploymentItem {
  company: string;
  period?: string;
}

export interface EducationItem {
  school: string;
  period?: string;
}

export interface GraduateRecord {
  id: string;
  photoUrl?: string;
  graduationYear: number;
  name: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  address: string;
  department: string;
  grade?: number | null;
  attendance?: AttendanceLevel | null;
  certificates: string[];
  email?: string | null;
  employmentHistory: EmploymentItem[];
  educationHistory: EducationItem[];
  desiredField: DesiredField[];
  currentStatus: StatusOption[];
  memo?: string;
  createdAt: string;
  updatedAt: string;
}
