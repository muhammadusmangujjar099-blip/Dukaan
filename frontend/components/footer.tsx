export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Dukaan. Cash on delivery across Pakistan.</p>
        <p>Free delivery on orders over Rs 5,000.</p>
      </div>
    </footer>
  );
}
