'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { setSetting } from '@/lib/settings';
import { logActivity } from '@/lib/activity';
import { redirectWithFlash } from '@/lib/flash';

const FIELD_GROUPS: Record<string, string> = {
  storeName: 'general',
  storeSlogan: 'general',
  currencyLabel: 'general',
  phone: 'general',
  email: 'general',
  address: 'general',
  workingHours: 'general',
  freeShippingThreshold: 'general',
  footerAbout: 'general',
  logoUrl: 'branding',
  faviconUrl: 'branding',
  primaryColor: 'branding',
  metaTitle: 'seo',
  metaDescription: 'seo',
  instagram: 'social',
  telegram: 'social',
  whatsapp: 'social',
  aparat: 'social',
  cardBankName: 'payment',
  cardHolderName: 'payment',
  cardNumber: 'payment',
  cardSheba: 'payment',
  receiptApp: 'payment',
  receiptNumber: 'payment',
  cardNote: 'payment'
};

export async function saveSettings(formData: FormData) {
  const session = await getSession();
  if (!hasPermission(session, 'settings.manage')) redirect('/admin');

  for (const [key, group] of Object.entries(FIELD_GROUPS)) {
    if (!formData.has(key)) continue;
    let value: unknown = String(formData.get(key)).trim();
    if (key === 'freeShippingThreshold') value = Math.round(Number(value) || 0);
    await setSetting(key, value, group);
  }

  // maintenance mode is a checkbox
  const maintenanceMode = formData.get('maintenanceMode') === 'on';
  await setSetting('maintenanceMode', maintenanceMode, 'general');

  await logActivity({ userId: session?.sub, adminName: session?.name, action: 'به‌روزرسانی تنظیمات', entity: 'settings' });
  revalidatePath('/');
  redirectWithFlash('/admin/settings', 'تنظیمات ذخیره شد');
}
