import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} OR Wallet. All rights reserved.
        </p>
        <div className="flex items-center gap-4">

        </div>
      </div>
    </footer>
  );
}
