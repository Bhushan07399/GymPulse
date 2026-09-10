import type { Pagination } from "@/src/types/member";

export type Payment = {
  id: string;
  gymId?: string;
  memberId: string;
  memberUuid: string;
  memberName?: string;
  memberPhone?: string;
  membershipPlanId: string;
  membershipPlanName?: string;
  paymentAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer";
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentDate: string;
  notes: string | null;
  transactionReference: string | null;
  nextDueDate: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentList = { payments: Payment[]; pagination: Pagination };
