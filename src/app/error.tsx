'use client';

// Global error boundary — shows a friendly Persian page instead of the
// default Next.js "Application error" screen.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const msg = error?.message || '';
  const isDbError =
    /database|prisma|connect|reach|ECONN|P1001|table|does not exist|relation/i.test(msg);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Vazirmatn, Tahoma, sans-serif',
        background: '#f8fafc',
        direction: 'rtl'
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(15,23,42,.08)'
        }}
      >
        <h1 style={{ fontSize: 20, margin: '0 0 8px', color: '#0f172a' }}>
          {isDbError ? 'در حال آماده‌سازی دیتابیس…' : 'خطایی پیش آمد'}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 2 }}>
          {isDbError
            ? 'دیتابیس در حال آماده‌سازی است. چند لحظه صبر کنید و دوباره تلاش کنید. اگر ادامه داشت، آدرس /api/setup را یک بار باز کنید.'
            : 'مشکلی در بارگذاری صفحه پیش آمد. دوباره تلاش کنید.'}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: '10px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#0b554d',
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          تلاش دوباره
        </button>
        {msg && (
          <p
            dir="ltr"
            style={{
              marginTop: 20,
              fontSize: 11,
              color: '#94a3b8',
              background: '#f1f5f9',
              padding: 8,
              borderRadius: 8,
              wordBreak: 'break-word'
            }}
          >
            {msg.split('\n')[0]}
          </p>
        )}
      </div>
    </div>
  );
}
