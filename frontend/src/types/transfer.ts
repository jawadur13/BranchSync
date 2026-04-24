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
    requestedAt: string;
}
