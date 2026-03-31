import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Shield, Music, BookOpen, Target, Info, Star, LogIn } from "lucide-react";
import { useState } from "react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

const navLinks = [
  { href: "/", label: "Início", icon: Shield },
  { href: "/hinos", label: "Hinos", icon: Music },
  { href: "/cfap-2026", label: "CFAP 2026", icon: Target },
  { href: "/sobre", label: "Sobre", icon: Info },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const isAdminOrMaster = isAuthenticated && (user?.role === "admin" || user?.role === "master");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="checkerboard-pattern w-full" />
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 object-contain" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1a3a2a] leading-tight" style={{ fontFamily: 'Merriweather, serif' }}>
              HINÁRIO PMAM
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Polícia Militar do Amazonas
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`gap-2 ${isActive ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : "text-foreground"}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
          {isAdminOrMaster ? (
            <Link href="/xerife">
              <Button
                variant={location.startsWith("/xerife") ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${location.startsWith("/xerife") ? "bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]" : "text-[#c4a84b]"}`}
              >
                <Star className="h-4 w-4" />
                Área do Xerife
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                variant={location === "/login" ? "default" : "ghost"}
                size="sm"
                className={`gap-2 ${location === "/login" ? "bg-[#c4a84b] text-[#1a1a1a] hover:bg-[#b39740]" : "text-[#c4a84b]"}`}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          )}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-white">
            <div className="flex flex-col gap-2 mt-8">
              <div className="flex items-center gap-3 mb-6 px-2">
                <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 object-contain" />
                <div>
                  <p className="font-bold text-[#1a3a2a]" style={{ fontFamily: 'Merriweather, serif' }}>HINÁRIO PMAM</p>
                  <p className="text-xs text-muted-foreground">Polícia Militar do Amazonas</p>
                </div>
              </div>
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 ${isActive ? "bg-[#1a3a2a] text-white" : ""}`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              {isAdminOrMaster ? (
                <Link href="/xerife" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-[#c4a84b]">
                    <Star className="h-4 w-4" />
                    Área do Xerife
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-[#c4a84b]">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
