'use client';

import { IconDownload } from '@/components/icons';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline h-10">
      <IconDownload className="h-4 w-4" />
      چاپ فاکتور
    </button>
  );
}
