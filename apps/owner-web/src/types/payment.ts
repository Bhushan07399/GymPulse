import type { Pagination } from "@/src/types/member";

export type Payment = { id: string; memberId: string; memberUuid: string; membershipPlanId: string; paymentAmount: number; totalAmount: number; paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer"; paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded"; paymentDate: string; notes: string | null; transactionReference: string | null; nextDueDate: string; };
export type PaymentList = { payments: Payment[]; pagination: Pagination };
