import { Link } from "wouter";
import { Shield, Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

export default function Footer() {
  const { data: settings } = trpc.settings.getAll.useQuery();

  return (
    <footer className="military-gradient text-white/80">
      <div className="checkerboard-pattern w-full" />
      <div className="container py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <img src={LOGO_URL} alt="Brasao PMAM" className="h-12 w-12 object-contain" />
            <div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Hinario PMAM
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {settings?.footer_text || "Hinos, canções militares e material de estudo da Polícia Militar do Amazonas"}
              </p>
              <p className="mt-1 text-xs text-white/40">Edição 2026</p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Página Inicial</Link></li>
              <li><Link href="/hinos" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Catálogo de Hinos</Link></li>
              <li><Link href="/charlie-mike" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Charlie Mike</Link></li>
              <li><Link href="/estudos" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Centro de Estudos</Link></li>
              <li><Link href="/cfap-2026" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">CFAP 2026</Link></li>
              <li><Link href="/sobre" className="text-white/60 transition-colors no-underline hover:text-[#c4a84b]">Sobre o Hinário</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contato</h4>
            <div className="space-y-2 text-sm">
              {settings?.footer_phone && (
                <p className="flex items-center gap-2 text-white/60">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-[#c4a84b]" />
                  {settings.footer_phone}
                </p>
              )}
              {settings?.footer_email && (
                <p className="flex items-center gap-2 text-white/60">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#c4a84b]" />
                  {settings.footer_email}
                </p>
              )}
              {settings?.footer_address && (
                <p className="flex items-center gap-2 text-white/60">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#c4a84b]" />
                  {settings.footer_address}
                </p>
              )}
              {(settings?.footer_instagram || settings?.footer_facebook) && (
                <div className="mt-3 flex items-center gap-3">
                  {settings?.footer_instagram && (
                    <a href={settings.footer_instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-[#c4a84b]">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.footer_facebook && (
                    <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 transition-colors hover:text-[#c4a84b]">
                      <Facebook className="h-5 w-5" />
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
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>Hinário da PMAM - Tradição, estudo e identidade institucional</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Servir e Proteger
          </p>
        </div>
      </div>
    </footer>
  );
}
