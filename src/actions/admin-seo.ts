'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';
import { setSetting } from '@/lib/settings';
import { runAutopilot, createGeneratedPost, type AutopilotMode } from '@/lib/seo/autopilot';

async function guard() {
  const session = await getSession();
  if (!hasPermission(session, 'settings.manage')) redirect('/admin');
  return session;
}
const str = (v: FormDataEntryValue | null) => (v ? String(v).trim() : '');

/** The ONE button — runs audit + auto-fix + article generation + report. */
export async function runSeoAutopilotAction(formData: FormData) {
  const session = await guard();
  const mode: AutopilotMode = str(formData.get('mode')) === 'auto' ? 'auto' : 'review';

  let summary = '';
  try {
    const r = await runAutopilot(mode, session?.sub);
    const fixedTotal = r.fixed.productSeo + r.fixed.productDesc + r.fixed.postSeo + r.fixed.pageSeo;
    summary = `دستیار سئو اجرا شد ✅ امتیاز: ${r.scoreBefore}→${r.scoreAfter} · ${fixedTotal} مورد اصلاح · مقاله «${r.post?.title}» ${mode === 'auto' ? 'منتشر شد' : 'در پیش‌نویس (منتظر تأیید شما)'}`;
    await logActivity({
      userId: session?.sub, adminName: session?.name,
      action: `اجرای دستیار سئو (${mode === 'auto' ? 'خودکار' : 'بازبینی'})`,
      entity: 'seo', newValue: `score ${r.scoreBefore}→${r.scoreAfter}`
    });
  } catch (e) {
    return redirectWithFlash('/admin/seo', `خطا در اجرای دستیار سئو: ${e instanceof Error ? e.message : 'نامشخص'}`, true);
  }
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/products');
  redirectWithFlash('/admin/seo', summary);
}

/** Generate a single blog article on a custom topic. */
export async function generateSeoPostAction(formData: FormData) {
  const session = await guard();
  const topic = str(formData.get('topic')) || null;
  const mode: AutopilotMode = str(formData.get('mode')) === 'auto' ? 'auto' : 'review';
  try {
    const { created, usedAi } = await createGeneratedPost(topic, mode, session?.sub);
    await logActivity({
      userId: session?.sub, adminName: session?.name,
      action: 'تولید مقاله با دستیار سئو', entity: 'blogPost', entityId: created.id, newValue: created.title
    });
    revalidatePath('/blog');
    redirectWithFlash(
      '/admin/seo',
      `مقاله «${created.title}» ${created.status === 'published' ? 'منتشر شد' : 'به‌صورت پیش‌نویس ذخیره شد'} (${usedAi ? 'با هوش مصنوعی' : 'با قالب هوشمند'})`
    );
  } catch (e) {
    redirectWithFlash('/admin/seo', `خطا در تولید مقاله: ${e instanceof Error ? e.message : 'نامشخص'}`, true);
  }
}

/** Save AI provider config + default mode. */
export async function saveSeoSettingsAction(formData: FormData) {
  const session = await guard();
  await setSetting('aiBaseUrl', str(formData.get('aiBaseUrl')), 'seo');
  await setSetting('aiApiKey', str(formData.get('aiApiKey')), 'seo');
  await setSetting('aiModel', str(formData.get('aiModel')) || 'openai/gpt-4o-mini', 'seo');
  await setSetting('seoAutoMode', str(formData.get('seoAutoMode')) === 'auto' ? 'auto' : 'review', 'seo');
  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'به‌روزرسانی تنظیمات دستیار سئو', entity: 'settings' });
  redirectWithFlash('/admin/seo', 'تنظیمات دستیار سئو ذخیره شد');
}
