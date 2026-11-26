import * as React from 'react';
import { Eye, Printer, RotateCcw, Trash2, CheckCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';

export interface WorkspaceRowActionsProps {
  onView?: () => void;
  onPrint?: () => void;
  onVerify?: () => void;
  onRevoke?: () => void;
  onDelete?: () => void;
  onCustomAction?: (actionName: string) => void;
  customActions?: Array<{ label: string; icon?: React.ReactNode; onClick: () => void }>;
}

export function WorkspaceRowActions({
  onView,
  onPrint,
  onVerify,
  onRevoke,
  onDelete,
  customActions = [],
}: WorkspaceRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-blue-600"
          onClick={onView}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onVerify && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={onVerify}
          title="Verify & Audit"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}

      {onPrint && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900"
          onClick={onPrint}
          title="Print / Download PDF"
        >
          <Printer className="h-4 w-4" />
        </Button>
      )}

      {onRevoke && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-amber-500 hover:text-amber-700"
          onClick={onRevoke}
          title="Revoke / Retry"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-700"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
