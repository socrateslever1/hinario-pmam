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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3">
            <img src={LOGO_URL} alt="Brasão PMAM" className="h-12 w-12 object-contain" />
            <div>
              <h3 className="font-bold text-white text-lg" style={{ fontFamily: 'Merriweather, serif' }}>
                Hinário PMAM
              </h3>
              <p className="text-sm text-white/60 mt-1">
                {settings?.footer_text || "Hinos e Canções Militares da Polícia Militar do Amazonas"}
              </p>
              <p className="text-xs text-white/40 mt-1">Edição 2025</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/60 hover:text-[#c4a84b] transition-colors no-underline">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/hinos" className="text-white/60 hover:text-[#c4a84b] transition-colors no-underline">
                  Catálogo de Hinos
                </Link>
              </li>
              <li>
                <Link href="/cfap-2026" className="text-white/60 hover:text-[#c4a84b] transition-colors no-underline">
                  CFAP 2026
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-white/60 hover:text-[#c4a84b] transition-colors no-underline">
                  Sobre o Hinário
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Contato</h4>
            <div className="space-y-2 text-sm">
              {settings?.footer_phone && (
                <p className="flex items-center gap-2 text-white/60">
                  <Phone className="h-3.5 w-3.5 text-[#c4a84b] shrink-0" />
                  {settings.footer_phone}
                </p>
              )}
              {settings?.footer_email && (
                <p className="flex items-center gap-2 text-white/60">
                  <Mail className="h-3.5 w-3.5 text-[#c4a84b] shrink-0" />
                  {settings.footer_email}
                </p>
              )}
              {settings?.footer_address && (
                <p className="flex items-center gap-2 text-white/60">
                  <MapPin className="h-3.5 w-3.5 text-[#c4a84b] shrink-0" />
                  {settings.footer_address}
                </p>
              )}
              {(settings?.footer_instagram || settings?.footer_facebook) && (
                <div className="flex items-center gap-3 mt-3">
                  {settings?.footer_instagram && (
                    <a href={settings.footer_instagram} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c4a84b] transition-colors">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {settings?.footer_facebook && (
                    <a href={settings.footer_facebook} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#c4a84b] transition-colors">
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
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/40">
          <p>Hinário da PMAM - Preservando a tradição e os valores da Polícia Militar do Amazonas</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Servir e Proteger
          </p>
        </div>
      </div>
    </footer>
  );
}
