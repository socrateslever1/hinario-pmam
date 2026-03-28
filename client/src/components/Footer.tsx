import { Shield } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";

export default function Footer() {
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
                Hinos e Canções Militares da Polícia Militar do Amazonas
              </p>
              <p className="text-xs text-white/40 mt-1">Edição 2023</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-[#c4a84b] transition-colors">Página Inicial</a></li>
              <li><a href="/hinos" className="hover:text-[#c4a84b] transition-colors">Catálogo de Hinos</a></li>
              <li><a href="/cfap-2026" className="hover:text-[#c4a84b] transition-colors">CFAP 2026</a></li>
              <li><a href="/sobre" className="hover:text-[#c4a84b] transition-colors">Sobre o Hinário</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Institucional</h4>
            <p className="text-sm text-white/60">
              Polícia Militar do Estado do Amazonas
            </p>
            <p className="text-sm text-white/60 mt-1">
              Centro de Formação e Aperfeiçoamento de Praças - CFAP
            </p>
            <p className="text-sm text-white/60 mt-1">
              Academia de Polícia Militar - APM Neper Alencar
            </p>
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
