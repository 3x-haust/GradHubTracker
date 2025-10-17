export enum Role {
  admin = 'admin',
  teacher = 'teacher',
}

export enum DepartmentEnum {
  유헬스시스템과 = '유헬스시스템과',
  유헬스디자인과 = '유헬스디자인과',
  의료IT과 = '의료IT과',
  의료비즈니스과 = '의료비즈니스과',
  디지털의료IT과 = '디지털의료IT과',
  보건간호과 = '보건간호과',
  _3D콘텐츠디자인과 = '3D콘텐츠디자인과',
  건강과학과 = '건강과학과',
  의료미용과 = '의료미용과',
}

export enum DesiredFieldEnum {
  제조 = '제조',
  사무 = '사무',
  피부미용 = '피부미용',
  간호 = '간호',
  보안 = '보안',
  서비스 = '서비스',
  기타 = '기타',
}

export enum StatusEnum {
  구직중 = '구직중',
  교육중 = '교육중',
  재학중 = '재학중',
  재직중 = '재직중',
  군복무 = '군복무',
}

export type Employment = {
  company: string;
  period?: string;
};

export type Education = {
  school: string;
  period?: string;
};
