export interface TransferResponseDto {
    requestId: number;
    requestCode: string;
    status: string;
    title: string;
    originBranchName: string;
    destinationBranchName: string;
    categoryName: string;
    priority: string;
    requestType: string;
    initiatedByFullName: string;
    initiatedById?: number;
    internalApproverId?: number;
    hqApproverId?: number;
    deptAcceptorId?: number;
    finalReleaserId?: number;
    deliveryPersonId?: number;
    requestedAt: string;
    behaviorType?: string;
    stockItemName?: string;
    quantity?: number;
}
