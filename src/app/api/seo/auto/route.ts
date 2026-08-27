import { NextRequest, NextResponse } from 'next/server';
import { runAutopilot } from '@/lib/seo/autopilot';
import { getSettings } from '@/lib/settings';

export const maxDuration = 300;

// Scheduled/automated trigger (e.g. Liara cron or an external uptime pinger):
//   GET /api/seo/auto?key=<AUTH_SECRET>
// Runs the autopilot in the admin-selected default mode.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || '';
  const secret = process.env.AUTH_SECRET || '';
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }
  const settings = await getSettings();
  const mode = String(settings.seoAutoMode || 'review') === 'auto' ? 'auto' : 'review';
  try {
    const r = await runAutopilot(mode);
    return NextResponse.json({
      ok: true,
      mode: r.mode,
      usedAi: r.usedAi,
      score: { before: r.scoreBefore, after: r.scoreAfter },
      fixed: r.fixed,
      post: r.post
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
