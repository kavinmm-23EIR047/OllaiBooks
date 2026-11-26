'use client';

import * as React from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface WorkspaceHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
}

export function WorkspaceHeader({
  title,
  description,
  badge,
  onRefresh,
  onExport,
  primaryAction,
  children,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pb-4 mb-5 border-b border-[#E3E6EA]">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] font-medium tracking-tight text-[#222222]">
            {title}
          </h1>
          {badge && (
            <Badge variant="info">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-[13px] text-[#555555] mt-0.5 leading-normal">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-1.5"
            title="Refresh records"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#555555]" />
            <span>Refresh</span>
          </Button>
        )}

        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-1.5"
            title="Export data"
          >
            <Download className="h-3.5 w-3.5 text-[#555555]" />
            <span>Export</span>
          </Button>
        )}

        {children}

        {primaryAction && (
          <Button
            variant="primary"
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5"
          >
            {primaryAction.icon || <Plus className="h-4 w-4" />}
            <span>{primaryAction.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
