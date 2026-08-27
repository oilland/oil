import { prisma } from './db';
import { cacheGet, cacheSet, cacheDel } from './cache';

const CACHE_KEY = 'settings:all';
const TTL = 30;

export interface SiteSettings {
  storeName: string;
  storeSlogan: string;
  currency: string; // نمایش ارز، پیش‌فرض تومان
  currencyLabel: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  workingHours: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  freeShippingThreshold: number;
  metaTitle: string;
  metaDescription: string;
  instagram: string;
  telegram: string;
  whatsapp: string;
  aparat: string;
  maintenanceMode: boolean;
  footerAbout: string;
  cardBankName: string;
  cardHolderName: string;
  cardNumber: string;
  cardSheba: string;
  receiptApp: string;
  receiptNumber: string;
  cardNote: string;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  seoAutoMode: string; // 'review' | 'auto'
  [key: string]: unknown;
}

const DEFAULTS: SiteSettings = {
  storeName: 'روغن‌لند',
  storeSlogan: 'مرجع تخصصی روغن و روانکار خودرو',
  currency: 'تومان',
  currencyLabel: 'تومان',
  phone: '021-91000000',
  mobile: '0912-0000000',
  email: 'info@example.com',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳۴',
  workingHours: 'شنبه تا پنجشنبه، ۹ تا ۱۸',
  logoUrl: '/images/logo.png',
  faviconUrl: '/images/logo.png',
  primaryColor: '#0b554d',
  freeShippingThreshold: 3000000,
  metaTitle: 'روغن‌لند | فروشگاه اینترنتی روغن موتور و روانکار',
  metaDescription: 'خرید اینترنتی انواع روغن موتور، روغن گیربکس، ضدیخ و مکمل با ضمانت اصالت کالا و ارسال سریع به سراسر کشور.',
  instagram: '',
  telegram: '',
  whatsapp: '',
  aparat: '',
  maintenanceMode: false,
  footerAbout:
    'روغن‌لند فروشگاه تخصصی روغن موتور، روغن گیربکس، ضدیخ و مکمل‌های خودرو با ضمانت اصالت کالا و مشاوره تخصصی رایگان است.',
  cardBankName: '',
  cardHolderName: '',
  cardNumber: '',
  cardSheba: '',
  receiptApp: '',
  receiptNumber: '',
  cardNote: '',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: 'openai/gpt-4o-mini',
  seoAutoMode: 'review'
};

export async function getSettings(): Promise<SiteSettings> {
  const cached = await cacheGet<SiteSettings>(CACHE_KEY);
  if (cached) return { ...DEFAULTS, ...cached };

  const rows = await prisma.siteSetting.findMany();
  const data: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      data[row.key] = JSON.parse(row.value);
    } catch {
      data[row.key] = row.value;
    }
  }
  const merged = { ...DEFAULTS, ...data } as SiteSettings;
  await cacheSet(CACHE_KEY, merged, TTL);
  return merged;
}

export async function getRawSettings() {
  return prisma.siteSetting.findMany({ orderBy: { group: 'asc' } });
}

export async function setSetting(key: string, value: unknown, group = 'general') {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), group },
    create: { key, value: JSON.stringify(value), group }
  });
  await cacheDel(CACHE_KEY);
}
