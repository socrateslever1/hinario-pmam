import { Link } from "wouter";
import { Shield, Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/logo/IMG_7728.PNG";

export default function Footer() {
  const { data: settings } = trpc.settings.getAll.useQuery();

  return (
    <footer className="military-gradient text-white/80">
      <div className="checkerboard-pattern h-1.5 w-full" />
      <div className="container py-3 md:py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr_1fr] md:items-start md:gap-8">
          <div className="flex items-start gap-2.5">
            <img src={LOGO_URL} alt="Brasao PMAM" className="h-8 w-8 object-contain md:h-9 md:w-9" />
            <div>
              <h3 className="text-sm font-bold leading-tight text-white md:text-base" style={{ fontFamily: "Merriweather, serif" }}>
                Meu Quartel
              </h3>
              <p className="mt-0.5 max-w-sm text-[11px] leading-snug text-white/60 md:text-xs">
                {settings?.footer_text || "Gestão, formação, comunicação e rotina militar em um só lugar"}
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">Plataforma Digital PMAM</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white md:text-xs">Navegação</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:block md:space-y-1 md:text-xs">
              <li><Link href="/" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Página Inicial</Link></li>
              <li><Link href="/hinos" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Módulo de Hinos</Link></li>
              <li><Link href="/charlie-mike" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Charlie Mike</Link></li>
              <li><Link href="/estudos" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Centro de Estudos</Link></li>
              <li><Link href="/cfap-2026" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">CFAP 2026</Link></li>
              <li><Link href="/sobre" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Sobre o Meu Quartel</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white md:text-xs">Contato</h4>
            <div className="grid grid-cols-1 gap-1 text-[11px] sm:block sm:space-y-1 md:text-xs">
              {settings?.footer_phone && (
                <p className="flex items-center gap-2 text-white/60">
                  <Phone className="h-3 w-3 shrink-0 text-[#c4a84b]" />
                  {settings.footer_phone}
                </p>
              )}
              {settings?.footer_email && (
                <p className="flex items-center gap-2 text-white/60">
                  <Mail className="h-3 w-3 shrink-0 text-[#c4a84b]" />
                  {settings.footer_email}
                </p>
              )}
              {settings?.footer_address && (
                <p className="flex items-center gap-2 text-white/60">
                  <MapPin className="h-3 w-3 shrink-0 text-[#c4a84b]" />
                  {settings.footer_address}
                </p>
              )}
              {(settings?.footer_instagram || settings?.footer_facebook) && (
                <div className="mt-1 flex items-center gap-3">
                  {settings?.footer_instagram && (
                    <a href={settings.footer_instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-[#c4a84b]">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {settings?.footer_facebook && (
                    <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-[#c4a84b]">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
              {!settings?.footer_phone && !settings?.footer_email && !settings?.footer_address && (
                <>
                  <p className="text-white/60">Polícia Militar do Estado do Amazonas</p>
                  <p className="text-white/60">Centro de Formação e Aperfeiçoamento de Praças - CFAP</p>
                  <p className="text-white/60">Academia de Polícia Militar - APM Neper Alencar</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-white/10 pt-2 text-center text-[10px] leading-tight text-white/40 md:mt-4 md:text-[11px]">
          <p>Meu Quartel - Gestão, formação e identidade institucional</p>
          <p className="mt-0.5 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Servir e Proteger
          </p>
        </div>
      </div>
    </footer>
  );
}