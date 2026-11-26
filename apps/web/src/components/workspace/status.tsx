import * as React from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

export interface WorkspaceStatusBadgeProps {
  status: string;
  className?: string;
}

export function WorkspaceStatusBadge({ status, className }: WorkspaceStatusBadgeProps) {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'PAID':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'SUCCESS':
    case 'DELIVERED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="mr-1 h-3 w-3 inline text-[#159957]" />
          {normalized}
        </Badge>
      );

    case 'PENDING':
    case 'PENDING_SYNC':
    case 'PROCESSING':
    case 'QUEUED':
    case 'TRIALING':
    case 'ISSUED':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="mr-1 h-3 w-3 inline text-[#D99117]" />
          {normalized === 'PENDING_SYNC' ? 'PENDING SYNC' : normalized}
        </Badge>
      );

    case 'PARTIALLY_PAID':
    case 'OVERDUE':
    case 'PAST_DUE':
    case 'ERROR':
      return (
        <Badge variant="destructive" className={className}>
          <AlertCircle className="mr-1 h-3 w-3 inline text-[#E5484D]" />
          {normalized}
        </Badge>
      );

    case 'FAILED':
    case 'CANCELLED':
    case 'DISCONNECTED':
    case 'CANCELED':
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="mr-1 h-3 w-3 inline text-[#E5484D]" />
          {normalized}
        </Badge>
      );

    case 'DRAFT':
    case 'PROFORMA':
    default:
      return (
        <Badge variant="secondary" className={className}>
          {normalized || 'UNKNOWN'}
        </Badge>
      );
  }
}
