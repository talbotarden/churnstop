export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-5xl font-bold tracking-tight">ChurnStop</h1>
      <p className="mt-4 text-xl text-gray-600">
        Cancellation save flow for WooCommerce Subscriptions. Stop losing
        subscribers the moment they click cancel.
      </p>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">MRR preserved</h3>
          <p className="mt-2 text-sm text-gray-600">
            See exactly how much recurring revenue your save flow rescued this month.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Click-to-cancel compliant</h3>
          <p className="mt-2 text-sm text-gray-600">
            Baked-in ROSCA / FTC compliance. Never accidentally violate cancellation law.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold">Conditional offers</h3>
          <p className="mt-2 text-sm text-gray-600">
            Discount price-sensitive customers, pause busy ones, reroute technical issues.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <a
          href="/pricing"
          className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          See pricing
        </a>
      </section>
    </main>
  );
}
