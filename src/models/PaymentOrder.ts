export interface PaymentOrder {
    id: string;
    oid: string;
    uid: string;
    amount: number;
    expiredAt: number;
    createdAt: number;
    paidAt?: number;
    updatedAt?: number;
    status: string;
    memo: string;
    closedAt?: number;
    redirectUrl?: string;
    logo?: string;
}