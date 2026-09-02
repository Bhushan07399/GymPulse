export interface MemberUser {
  id: string;
  memberId: string;
  gymId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gymName?: string;
  role: 'Member';
}

export interface MemberAuthResponse {
  token: string;
  member: MemberUser;
}
