import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { getLastReport } from '@/lib/seo/autopilot';

// Download the last SEO autopilot report as a Markdown file (admin only).
export async function GET() {
  const session = await getSession();
  if (!hasPermission(session, 'settings.manage')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }
  const report = await getLastReport();
  if (!report) {
    return NextResponse.json({ error: 'هنوز گزارشی ثبت نشده است' }, { status: 404 });
  }
  const date = report.finishedAt.slice(0, 10);
  return new NextResponse(report.reportMarkdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="seo-report-${date}.md"`
    }
  });
}
