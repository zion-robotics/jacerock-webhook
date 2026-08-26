import type { TransactionStatus } from '../../types';

const statusConfig: Record<string, { label: string; className: string }> = {
  AWAITING_STAFF_APPROVAL: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800' },
  PAYMENT_VERIFIED: { label: 'Verified', className: 'bg-blue-100 text-blue-800' },
  SETTLEMENT_PROCESSING: { label: 'Processing', className: 'bg-purple-100 text-purple-800' },
  SETTLEMENT_COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', className: 'bg-slate-100 text-slate-600' },
  REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-purple-100 text-purple-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
  PAYMENT_MISMATCH: { label: 'Mismatch', className: 'bg-red-100 text-red-800' },
  KYC_MISMATCH: { label: 'KYC Mismatch', className: 'bg-red-100 text-red-800' },
  RECEIPT_UPLOADED: { label: 'Receipt Uploaded', className: 'bg-blue-100 text-blue-800' },
  ADDITIONAL_INFORMATION_REQUIRED: { label: 'More Info Needed', className: 'bg-amber-100 text-amber-800' },
};

interface StatusBadgeProps {
  status: TransactionStatus | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status.replace(/_/g, ' '), className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
