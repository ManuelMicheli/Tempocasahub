'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0b0d', color: '#e5e7eb' }}>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Errore critico</h2>
          <p style={{ color: '#9ca3af', maxWidth: '400px', textAlign: 'center' }}>
            {error.message || 'Si è verificato un errore critico del server.'}
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Digest: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1.5rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
