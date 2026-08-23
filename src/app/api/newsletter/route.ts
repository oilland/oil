import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const KEY = 'newsletter_subscribers';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'ایمیل نامعتبر است' }, { status: 400 });
    }
    const existing = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    let list: string[] = [];
    try {
      list = existing ? JSON.parse(existing.value) : [];
    } catch {
      list = [];
    }
    if (!list.includes(email)) list.push(email);
    await prisma.siteSetting.upsert({
      where: { key: KEY },
      update: { value: JSON.stringify(list) },
      create: { key: KEY, value: JSON.stringify(list), group: 'general' }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
