import { Link } from "wouter";
import { Shield, Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/logo/IMG_7728.PNG";

export default function Footer() {
  const { data: settings } = trpc.settings.getAll.useQuery();

  return (
    <footer className="military-gradient text-white/80">
      <div className="checkerboard-pattern h-1.5 w-full" />
      <div className="container py-5 md:py-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_1fr_1fr] md:items-start md:gap-8">
          <div className="flex items-start gap-3">
            <img src={LOGO_URL} alt="Brasão PMAM" className="h-10 w-10 object-contain" />
            <div>
              <h3 className="text-base font-bold leading-tight text-white" style={{ fontFamily: "Merriweather, serif" }}>
                QG Digital
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-white/65 md:text-sm">
                {settings?.footer_text || "Gestão, formação, comunicação e rotina militar em um só lugar"}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Plataforma Militar</p>
            </div>
          </div>

          <div className="hidden sm:block">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Navegação</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs md:block md:space-y-1.5 md:text-sm">
              <li><Link href="/" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">Página Inicial</Link></li>
              <li><Link href="/hinos" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">Módulo de Hinos</Link></li>
              <li><Link href="/charlie-mike" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">Charlie Mike</Link></li>
              <li><Link href="/drill" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">Ordem Unida</Link></li>
              <li><Link href="/cfap-2026" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">CFAP 2026</Link></li>
              <li><Link href="/historia-cfap" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">História e Comandantes</Link></li>
              <li><Link href="/sobre" className="text-white/65 transition-colors no-underline hover:text-[#c4a84b]">Sobre o QG Digital</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">Contato</h4>
            <div className="grid grid-cols-1 gap-1.5 text-xs sm:block sm:space-y-1.5 md:text-sm">
              {settings?.footer_phone && (
                <p className="flex items-center gap-2 text-white/65">
                  <Phone className="h-4 w-4 shrink-0 text-[#c4a84b]" />
                  {settings.footer_phone}
                </p>
              )}
              {settings?.footer_email && (
                <p className="flex items-center gap-2 text-white/65">
                  <Mail className="h-4 w-4 shrink-0 text-[#c4a84b]" />
                  {settings.footer_email}
                </p>
              )}
              {settings?.footer_address && (
                <p className="flex items-center gap-2 text-white/65">
                  <MapPin className="h-4 w-4 shrink-0 text-[#c4a84b]" />
                  {settings.footer_address}
                </p>
              )}
              {(settings?.footer_instagram || settings?.footer_facebook) && (
                <div className="mt-2 flex items-center gap-3">
                  {settings?.footer_instagram && (
                    <a href={settings.footer_instagram} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-white/65 transition-colors hover:text-[#c4a84b]" aria-label="Instagram">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.footer_facebook && (
                    <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="rounded-full p-1 text-white/65 transition-colors hover:text-[#c4a84b]" aria-label="Facebook">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
              {!settings?.footer_phone && !settings?.footer_email && !settings?.footer_address && (
                <>
                  <p className="text-white/65">Polícia Militar do Estado do Amazonas</p>
                  <p className="text-white/65">Centro de Formação e Aperfeiçoamento de Praças — CFAP</p>
                  <p className="text-white/65">Academia de Polícia Militar — APM Neper Alencar</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-3 text-center text-xs leading-relaxed text-white/45">
          <p>QG Digital — Plataforma Militar</p>
          <p className="mt-1 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Servir e Proteger
          </p>
        </div>
      </div>
    </footer>
  );
}
