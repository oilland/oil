import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getSession } from '@/lib/session';
import { CheckoutForm } from '@/components/shop/CheckoutForm';

export const metadata = { title: 'تسویه حساب' };

export default async function CheckoutPage() {
  const [shippingMethods, settings, session] = await Promise.all([
    prisma.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    getSettings(),
    getSession()
  ]);

  const user = session
    ? await prisma.user.findUnique({ where: { id: session.sub }, select: { name: true, email: true, phone: true } })
    : null;

  return (
    <div className="container-x section">
      <h1 className="mb-6 text-xl font-extrabold text-slate-900 md:text-2xl">تسویه حساب</h1>
      <CheckoutForm
        shippingMethods={shippingMethods}
        freeShippingThreshold={settings.freeShippingThreshold}
        currencyLabel={settings.currencyLabel}
        session={user ? { name: user.name, email: user.email, phone: user.phone ?? undefined } : null}
        cardSettings={{
          bankName: settings.cardBankName,
          holderName: settings.cardHolderName,
          cardNumber: settings.cardNumber,
          sheba: settings.cardSheba,
          receiptApp: settings.receiptApp,
          receiptNumber: settings.receiptNumber,
          note: settings.cardNote
        }}
      />
    </div>
  );
}
