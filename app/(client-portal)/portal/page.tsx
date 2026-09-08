export default function ClientDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground">Dashboard Anda</h1>
      <p className="mt-2 text-muted-foreground">
        Pantau performa layanan dan status proyek Anda di sini.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 border border-border bg-card rounded-xl">
          <h3 className="text-lg font-semibold">Proyek Aktif</h3>
          <p className="text-4xl font-bold text-primary mt-2">2</p>
        </div>
        <div className="p-6 border border-border bg-card rounded-xl">
          <h3 className="text-lg font-semibold">Tagihan Belum Dibayar</h3>
          <p className="text-4xl font-bold text-primary mt-2">1</p>
        </div>
      </div>
    </div>
  );
}
