export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MembersTab: undefined;
  ScanTab: undefined;
  PaymentsTab: undefined;
  AttendanceTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MemberDetail: { memberId: string };
  AddMember: undefined;
  CollectPayment: { memberId?: string; memberName?: string };
  AttendanceLedger: undefined;
  ReceptionScanner: undefined;
};
