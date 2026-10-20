export interface ApiQuotaBalance {
    initialQuota?: number;
    initialQuotaInUnit?: number;
    totalDelivered?: number;
    remainingBalance?: number;
    remainingBalanceInQq?: number;
    unit?: string;
    isExceeded?: boolean;
    isNearLimit?: boolean;
    plotName?: string;
    farmerTotalDelivered?: number;
    farmerTotalQuotaInUnit?: number;
    farmerTotalRemainingBalance?: number;
}
