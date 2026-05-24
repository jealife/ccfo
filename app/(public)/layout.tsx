import { PublicNavbar } from "@/components/public/Navbar";
import { PublicFooter } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <PublicNavbar />
      <div className="flex-1 bg-background">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
