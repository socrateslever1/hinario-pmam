import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserProfileTab } from "@/components/admin/UserProfileTab";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogIn, User } from "lucide-react";

export default function UserProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] md:bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#1a3a2a]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] md:bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md border-border/50 bg-white text-foreground shadow-md">
            <CardContent className="p-8 text-center">
              <User className="mx-auto mb-4 h-14 w-14 text-[#c4a84b]" />
              <h1 className="mb-2 text-2xl font-bold text-[#1a3a2a]" style={{ fontFamily: "Merriweather, serif" }}>
                Perfil Pessoal
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Entre com sua conta para preencher seu perfil particular.
              </p>
              <Link href="/login">
                <Button className="w-full gap-2 bg-[#1a3a2a] text-white hover:bg-[#10281d]">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col bg-[#f5f2e8] md:bg-background">
      <Navbar />

      <section className="border-b border-border/40 bg-white px-4 pb-7 pt-6 md:px-0 md:py-8">
        <div className="container">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-[#c4a84b]" />
            <div>
              <h1 className="text-2xl font-bold text-[#1a3a2a]" style={{ fontFamily: "Merriweather, serif" }}>
                Perfil Pessoal
              </h1>
              <p className="text-sm text-muted-foreground">
                Área facultativa para foto, informações da conta e troca de senha.
              </p>
            </div>
          </div>
        </div>
        <div className="checkerboard-pattern mt-6 hidden w-full md:block" />
      </section>

      <main className="flex-1 px-4 py-6 md:px-0 md:py-8">
        <div className="container">
          <UserProfileTab showDirectory={false} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
