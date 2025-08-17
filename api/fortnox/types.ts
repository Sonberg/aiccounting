export interface FortnoxAccount {
  Active: boolean;
  BalanceBroughtForward: number;
  CostCenter: string | null;
  CostCenterSettings: 'ALLOWED' | 'MANDATORY' | 'NOTALLOWED';
  Description: string;
  Number: number;
  Project: string;
  ProjectSettings: 'ALLOWED' | 'MANDATORY' | 'NOTALLOWED';
  SRU: number;
  VATCode: string | null;
  Year: number;
}

export interface FortnoxVoucher {
  ApprovalState: number;
  Comments: string | null;
  Description: string | null;
  ReferenceNumber: string | null;
  ReferenceType:
    | 'INVOICE'
    | 'SUPPLIERINVOICE'
    | 'INVOICEPAYMENT'
    | 'SUPPLIERPAYMENT'
    | 'MANUAL'
    | 'CASHINVOICE'
    | 'ACCRUAL'
    | string
    | null;
  TransactionDate: string;
  VoucherNumber: number;
  VoucherSeries: string;
  VoucherRows?: FortnoxVoucherRow[];
  Year: number;
}

export interface FortnoxVoucherRow {
  Account: number;
  CostCenter: string | null;
  Credit: number;
  Debit: number;
  Description: string | null;
  Project: string | null;
  Quantity: number;
  Removed: boolean;
  TransactionInformation: string | null;
}
