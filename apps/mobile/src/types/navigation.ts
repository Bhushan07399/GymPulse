/**
 * obo Unified Mobile App — Navigation Param Lists
 * Strictly-typed route parameters for Root, Auth, and Role Navigators.
 */

import { UserRole } from './role';

export type RootStackParamList = {
  Auth: undefined;
  OwnerFlow: undefined;
  StaffFlow: undefined;
  MemberFlow: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword?: { emailOrPhone?: string };
};

export type OwnerTabParamList = {
  HomeTab: undefined;
  MembersTab: undefined;
  ScanTab: undefined;
  AttendanceTab: undefined;
  PaymentsTab: undefined;
  MoreTab: undefined;
};

export type StaffTabParamList = {
  ReceptionTab: undefined;
  AttendanceTab: undefined;
  PaymentsTab: undefined;
  MembersTab: undefined;
  ProfileTab: undefined;
};

export type MemberTabParamList = {
  HomeTab: undefined;
  PassTab: undefined;
  AttendanceTab: undefined;
  ClassesTab: undefined;
  ProfileTab: undefined;
};

export type OwnerStackParamList = {
  MainTabs: undefined;
  MemberDetail: { memberId: string };
  AddMember: undefined;
  CollectPayment: { memberId?: string };
  AttendanceLedger: undefined;
  ReceptionScanner: undefined;
  GymSwitcher: undefined;
  SubscriptionStatus: undefined;
};

export type MemberStackParamList = {
  MainTabs: undefined;
  GymQrScanner: undefined;
  ClassDetail: { classId: string; sessionId?: string };
  ReceiptView: { paymentId: string };
  ProfileEdit: undefined;
};
