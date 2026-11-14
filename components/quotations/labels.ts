import type { PaymentMode, QuoteStatus } from "@/lib/quotations/model";

export const PAYMENT_LABEL: Record<PaymentMode, string> = { terms: "Payment in terms", emi: "EMI", both: "Terms or EMI" };

/* reuse the admin chip colours */
export const quoteStatusTone: Record<QuoteStatus, string> = { sent: "pending", accepted: "won", declined: "rejected" };
