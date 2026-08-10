import { PublicNavbar } from "@/components/public/Navbar";
import { PublicFooter } from "@/components/public/Footer";
import { isRegistrationOpen } from "@/lib/registration";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const registrationsOpen = await isRegistrationOpen();

  return (
    <div className="flex flex-col min-h-dvh">
      <PublicNavbar registrationsOpen={registrationsOpen} />
      <div className="flex-1 bg-background">
        {children}
      </div>
      <PublicFooter registrationsOpen={registrationsOpen} />
    </div>
  );
}
