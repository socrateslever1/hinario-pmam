import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Printer, 
  FileText, 
  RotateCcw, 
  Eye, 
  Edit2, 
  BookOpen, 
  Shield, 
  Calendar,
  User,
  MapPin,
  ClipboardList,
  Check,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { getStudentSession } from "@/lib/studentSession";
import { trpc } from "@/lib/trpc";

const BRASAO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";
const PMAM_HEADER_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/pmam-brasao_d5ee8977.png";
const CFAP_HEADER_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028422427/oYQqDtLooPR5vbQ65ChDb9/cfap-brasao_placeholder.png"; // Usando BRASAO_URL como fallback

type DocType = "parte" | "requerimento" | "defesa" | "guia";

interface DocumentData {
  type: DocType;
  // Campos Gerais
  remetente: string;
  destinatario: string;
  assunto: string;
  anexo: string;
  localData: string;
  
  // Específicos para Parte
  parteFatoData: string;
  parteFatoHora: string;
  parteFatoLocal: string;
  parteRelato: string;
  parteFecho: string;
  
  // Específicos para Requerimento
  reqNomeCompleto: string;
  reqMatricula: string;
  reqPelotao: string;
  reqSolicitacao: string;
  reqJustificativa: string;
  
  // Específicos para Defesa
  defesaFatoRef: string;
  defesaTexto: string;
  
  // Específicos para Guia
  guiaDestino: string;
  guiaIda: string;
  guiaVolta: string;
  guiaMotivo: string;
  guiaTransporte: string;
}

const PARTE_DEFAULT_RELATO = "Considerando que a data natalícia deste Aluno Soldado PM é 18 de abril de 1985, conforme cópia da identidade em anexo.\nSolicito a possibilidade de que seja concedida a dispensa deste Aluno Soldado das escalas de serviço desta Unidade da PMAM no dia 18 de abril de 2026, fins de congraçamento junto aos familiares e amigos.";

const defaultValues: Record<DocType, DocumentData> = {
  parte: {
    type: "parte",
    remetente: "Al. Sd. PM Nº 1234 Silva",
    destinatario: "Ao Sr. Comandante da Companhia de Alunos do CFAP",
    assunto: "Solicitação (FAZ)",
    anexo: "___ (Se houver)",
    localData: "Manaus - AM, " + new Date().toLocaleDateString("pt-BR"),
    parteFatoData: new Date().toLocaleDateString("pt-BR"),
    parteFatoHora: "08:30",
    parteFatoLocal: "Sala de Instrução 03",
    parteRelato: PARTE_DEFAULT_RELATO,
    parteFecho: "Respeitosamente,",
    reqNomeCompleto: "",
    reqMatricula: "",
    reqPelotao: "",
    reqSolicitacao: "",
    reqJustificativa: "",
    defesaFatoRef: "",
    defesaTexto: "",
    guiaDestino: "",
    guiaIda: "",
    guiaVolta: "",
    guiaMotivo: "",
    guiaTransporte: ""
  },
  requerimento: {
    type: "requerimento",
    remetente: "ALUNO SOLDADO PM SILVA",
    destinatario: "ILUSTRÍSSIMO SENHOR DIRETOR DO CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS",
    assunto: "Requerimento Administrativo",
    anexo: "",
    localData: "Manaus - AM, " + new Date().toLocaleDateString("pt-BR"),
    parteFatoData: "",
    parteFatoHora: "",
    parteFatoLocal: "",
    parteRelato: "",
    parteFecho: "",
    reqNomeCompleto: "Felipe da Silva Santos",
    reqMatricula: "123.456-7 A",
    reqPelotao: "3º Pelotão - 1ª Companhia",
    reqSolicitacao: "Realização de Segunda Chamada de Avaliação Pedagógica",
    reqJustificativa: "Requer a V.S.ª a autorização para a realização da prova de segunda chamada da disciplina de 'Regulamento Disciplinar da PMAM (RDPMAM)', realizada no dia 04 de junho de 2026, tendo em vista que este requerente encontrava-se impossibilitado de comparecer na data prevista devido a dispensa médica devidamente homologada pela Policlínica da PMAM, conforme atestado em anexo.",
    defesaFatoRef: "",
    defesaTexto: "",
    guiaDestino: "",
    guiaIda: "",
    guiaVolta: "",
    guiaMotivo: "",
    guiaTransporte: ""
  },
  defesa: {
    type: "defesa",
    remetente: "Al. Sd. PM Nº 1234 Silva",
    destinatario: "Ao Sr. Chefe da Seção de Justiça e Disciplina do CFAP",
    assunto: "Apresentação de Justificativa de Fato Apontado",
    anexo: "",
    localData: "Manaus - AM, " + new Date().toLocaleDateString("pt-BR"),
    parteFatoData: "",
    parteFatoHora: "",
    parteFatoLocal: "",
    parteRelato: "",
    parteFecho: "",
    reqNomeCompleto: "",
    reqMatricula: "",
    reqPelotao: "",
    reqSolicitacao: "",
    reqJustificativa: "",
    defesaFatoRef: "FAT-048/2026",
    defesaTexto: "Em atenção ao fato apontado sob registro FAT-048/2026, referente ao suposto atraso de 10 minutos para a formatura matinal do dia 03 de junho de 2026, venho expor e justificar que o atraso ocorreu devido a uma pane mecânica no veículo particular deste discente a caminho do quartel. Salienta-se que, tão logo resolvido o imprevisto, o discente apresentou-se imediatamente ao oficial de dia, justificando o ocorrido e solicitando sua inclusão no dispositivo formado. Solicito a atenuação do fato sob os preceitos do Art. 22 do Manual do Aluno.",
    guiaDestino: "",
    guiaIda: "",
    guiaVolta: "",
    guiaMotivo: "",
    guiaTransporte: ""
  },
  guia: {
    type: "guia",
    remetente: "Al. Sd. PM Nº 1234 Silva",
    destinatario: "Ao Sr. Comandante do Corpo de Alunos do CFAP",
    assunto: "Solicitação de Guia de Trânsito",
    anexo: "",
    localData: "Manaus - AM, " + new Date().toLocaleDateString("pt-BR"),
    parteFatoData: "",
    parteFatoHora: "",
    parteFatoLocal: "",
    parteRelato: "",
    parteFecho: "",
    reqNomeCompleto: "",
    reqMatricula: "",
    reqPelotao: "",
    reqSolicitacao: "",
    reqJustificativa: "",
    defesaFatoRef: "",
    defesaTexto: "",
    guiaDestino: "Parintins - AM",
    guiaIda: "12/06/2026",
    guiaVolta: "15/06/2026",
    guiaMotivo: "Visita familiar durante o período de folga regulamentar de fim de semana prolongado.",
    guiaTransporte: "Transporte hidroviário de linha regular",
  }
};

function formatParteDate(localData: string) {
  const cleaned = localData.replace(/^Manaus\s*-\s*AM,\s*/i, "").trim();
  return cleaned || new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function countParteConsiderandos(text: string) {
  const matches = text.match(/(^|\n)\s*considerando\b/gi);
  return matches?.length ?? 0;
}

function normalizeDocumentData(type: DocType, data: Partial<DocumentData>) {
  const normalized: DocumentData = {
    ...defaultValues[type],
    ...data,
    type,
  };

  if (
    type === "parte" &&
    (!normalized.parteRelato ||
      normalized.parteRelato.includes("ausência imotivada") ||
      normalized.parteRelato.includes("Participo a V.S.ª"))
  ) {
    normalized.parteRelato = PARTE_DEFAULT_RELATO;
  }

  if (type === "parte" && !normalized.anexo) {
    normalized.anexo = "___ (Se houver)";
  }

  if (type === "parte" && !normalized.parteFecho) {
    normalized.parteFecho = "Respeitosamente,";
  }

  if (type === "parte" && normalized.assunto === "Participação de Ocorrência Escolar") {
    normalized.assunto = "Solicitação (FAZ)";
  }

  return normalized;
}

function ParteOfficialPreview({ docData }: { docData: DocumentData }) {
  const remetente = docData.remetente || "AL SD PM (1111) FULANO (CI 11111)";
  const destinatario = docData.destinatario || "CAP QOPM Cmt do CAL";
  const assunto = docData.assunto || "Solicitação (FAZ)";
  const relato = docData.parteRelato || PARTE_DEFAULT_RELATO;
  const fecho = docData.parteFecho || "Respeitosamente,";

  return (
    <div className="flex min-h-[245mm] w-full flex-col text-[12px] leading-[1.45] text-black">
      <header className="relative mb-8 min-h-[31mm] text-center font-serif">
        <img src={PMAM_HEADER_URL} alt="Brasão PMAM" className="absolute left-0 top-0 h-[24mm] w-[24mm] object-contain" />
        <div className="mx-auto max-w-[120mm] pt-1 uppercase leading-tight text-gray-700">
          <p>POLÍCIA MILITAR DO AMAZONAS</p>
          <p>DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</p>
          <p>CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</p>
          <p className="text-[24px] font-bold leading-none">CFAP</p>
        </div>
        <img src={CFAP_HEADER_URL} alt="Brasão CFAP" className="absolute right-0 top-0 h-[23mm] w-[27mm] object-contain" />
      </header>

      <section className="grid grid-cols-2 gap-8">
        <p>Parte S/Nº/2026</p>
        <p>Quartel em Manaus-AM, {formatParteDate(docData.localData)}.</p>
      </section>

      <section className="ml-auto mt-4 w-[50%] leading-[1.35]">
        <p><strong>Do:</strong> {remetente}</p>
        <p><strong>Ao:</strong> {destinatario}</p>
        <p><strong>Assunto:</strong> {assunto}</p>
        <p><strong>Anexo:</strong> {docData.anexo || "___ (Se houver)"}</p>
      </section>

      <main className="mt-10 flex-1 whitespace-pre-line text-justify">
        <p className="mb-7 indent-[15mm]">Senhor Comandante,</p>
        {relato.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index} className="mb-3 indent-[15mm]">
            {paragraph}
          </p>
        ))}
        <p className="mt-10 indent-[15mm]">{fecho}</p>
      </main>

      <section className="mb-8 text-center">
        <p>{remetente}</p>
        <p>Solicitante</p>
      </section>

      <footer className="mt-auto border-t border-double border-black pt-1 text-center text-[9px] leading-tight text-gray-600">
        <p className="font-bold">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS - CFAP</p>
        <p>Av. Governador Danilo de Matos, nº381, Bloco L, Distrito Industrial - CEP: 69.075-351 - Manaus/AM</p>
        <p>cfap@pm.am.gov.br</p>
      </footer>
    </div>
  );
}

function formatSender(numerica: string, nomeGuerra: string, rg: string) {
  const cleanNome = (nomeGuerra || "").toUpperCase();
  const cleanRg = rg ? ` (CI ${rg})` : "";
  return `AL SD PM (${numerica}) ${cleanNome}${cleanRg}`;
}

export default function Documents() {
  const [docType, setDocType] = useState<DocType>("parte");
  const [docData, setDocData] = useState<DocumentData>(defaultValues.parte);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const parteConsiderandoCount = countParteConsiderandos(docData.parteRelato);

  const session = getStudentSession();
  const profileQuery = trpc.student.getProfile.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );

  // Carregar dados salvos do localStorage ou mesclar com o perfil oficial
  useEffect(() => {
    const saved = localStorage.getItem(`pmam_doc_${docType}`);
    if (saved) {
      try {
        const normalized = normalizeDocumentData(docType, JSON.parse(saved));
        setDocData(normalized);
        localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(normalized));
      } catch (e) {
        setDocData(defaultValues[docType]);
      }
    } else {
      const baseDefaults = { ...defaultValues[docType] };
      if (session && profileQuery.data) {
        const senderString = formatSender(
          session.numerica,
          profileQuery.data.nomeGuerra || session.nomeGuerra,
          profileQuery.data.rg || ""
        );
        baseDefaults.remetente = senderString;

        if (docType === "requerimento") {
          baseDefaults.reqNomeCompleto = profileQuery.data.nomeCompleto || "";
          baseDefaults.reqMatricula = profileQuery.data.rg || "";
          baseDefaults.reqPelotao = `${session.peloton}º Pelotão - ${session.companhia}ª Companhia`;
        }
      }
      setDocData(normalizeDocumentData(docType, baseDefaults));
    }
  }, [docType, profileQuery.data]);

  // Salvar no localStorage sempre que mudar
  const handleFieldChange = (field: keyof DocumentData, value: string) => {
    const updated = { ...docData, [field]: value };
    setDocData(updated);
    localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(updated));
  };

  const handleReset = () => {
    if (window.confirm("Deseja realmente redefinir o documento para o padrão oficial?")) {
      setDocData(normalizeDocumentData(docType, defaultValues[docType]));
      localStorage.removeItem(`pmam_doc_${docType}`);
      toast.success("Documento redefinido com sucesso!");
    }
  };

  const handlePrint = () => {
    toast.info("Abrindo janela de impressão/salvamento PDF...");
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="military-gradient py-8 md:py-12 relative overflow-hidden print:hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c4a84b] rounded-full blur-[100px]" />
        </div>
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-4 w-4 text-[#c4a84b]" />
            <span className="text-sm text-white/80">Setor de Expediente CFAP</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Gerador de <span className="gold-gradient-text">Documentos Militares</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base">
            Crie, formate e exporte documentos oficiais de acordo com os padrões regulamentares do RISG e do CFAP da Polícia Militar do Amazonas.
          </p>
        </div>
      </section>

      {/* Main Panel */}
      <main className="flex-1 container py-8 print:p-0 print:m-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* Form Side */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            <Card className="border-border/50 shadow-md bg-white">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1a3a2a]">Tipo de Documento</label>
                  <Select
                    value={docType}
                    onValueChange={(val: DocType) => setDocType(val)}
                  >
                    <SelectTrigger className="bg-muted/30">
                      <SelectValue placeholder="Selecione o documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parte">📁 Parte de Ocorrência / Disciplinar</SelectItem>
                      <SelectItem value="requerimento">📝 Requerimento Administrativo</SelectItem>
                      <SelectItem value="defesa">🛡️ Defesa Escrita / Justificativa</SelectItem>
                      <SelectItem value="guia">✈️ Guia de Trânsito (Viagem)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === "edit" ? "default" : "outline"} 
                    className={`flex-1 gap-2 ${viewMode === "edit" ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : ""}`}
                    onClick={() => setViewMode("edit")}
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button 
                    variant={viewMode === "preview" ? "default" : "outline"} 
                    className={`flex-1 gap-2 lg:hidden ${viewMode === "preview" ? "bg-[#1a3a2a] text-white hover:bg-[#1a3a2a]/90" : ""}`}
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Downloads Section */}
            <Card className="border-border/50 shadow-md bg-white">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Download className="h-5 w-5 text-[#c4a84b]" />
                  <h3 className="font-bold text-[#1a3a2a] text-base" style={{ fontFamily: "Inter, sans-serif" }}>
                    Downloads Oficiais (Modelos)
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Pecúlio Card */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">Pecúlio CFSD 2026</span>
                        <span className="text-[10px] text-muted-foreground truncate">Regulamento 4ª Cia 1º Pel</span>
                      </div>
                    </div>
                    <a href="/documents/peculio_cfsd_2026.pdf" download="PECULIO_CFSD_2026_4CIA_1PEL.pdf" className="shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 bg-white hover:bg-muted text-foreground border-border">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </a>
                  </div>

                  {/* Modelo de Parte Card */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                        DOCX
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">Modelo de Parte</span>
                        <span className="text-[10px] text-muted-foreground truncate">Estrutura oficial editável (.docx)</span>
                      </div>
                    </div>
                    <a href="/documents/modelo_de_parte.docx" download="Modelo_de_Parte.docx" className="shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 bg-white hover:bg-muted text-foreground border-border">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </a>
                  </div>

                  {/* Matriz Curricular Card */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                        DOCX
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate">Matriz Curricular CFSD</span>
                        <span className="text-[10px] text-muted-foreground truncate">Grade de disciplinas 2025 (.docx)</span>
                      </div>
                    </div>
                    <a href="/documents/matriz_curricular_cfsd2025.docx" download="Matriz_Curricular_CFSD_2025.docx" className="shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 bg-white hover:bg-muted text-foreground border-border">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inputs Editor */}
            <Card className="border-border/50 shadow-md bg-white flex-1">
              <CardContent className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-[#1a3a2a] text-base" style={{ fontFamily: "Inter, sans-serif" }}>
                    Preencher Dados
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive gap-1 px-2 h-8">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>

                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Campos Comuns */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Remetente (Identidade Militar)
                    </label>
                    <Input 
                      value={docData.remetente}
                      onChange={(e) => handleFieldChange("remetente", e.target.value)}
                      placeholder="Ex: Al. Sd. PM Nº 1234 Silva"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Destinatário</label>
                    <Input 
                      value={docData.destinatario}
                      onChange={(e) => handleFieldChange("destinatario", e.target.value)}
                      placeholder="Ex: Ao Sr. Comandante do CFAP"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Assunto</label>
                    <Input
                      value={docData.assunto}
                      onChange={(e) => handleFieldChange("assunto", e.target.value)}
                      placeholder="Ex: Solicitação (FAZ)"
                    />
                  </div>

                  {docType === "parte" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Anexo</label>
                      <Input
                        value={docData.anexo}
                        onChange={(e) => handleFieldChange("anexo", e.target.value)}
                        placeholder="___ (Se houver)"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Local e Data</label>
                    <Input 
                      value={docData.localData}
                      onChange={(e) => handleFieldChange("localData", e.target.value)}
                      placeholder="Manaus - AM, DD/MM/AAAA"
                    />
                  </div>

                  {/* Campos específicos da PARTE */}
                  {docType === "parte" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Data do Fato
                          </label>
                          <Input 
                            value={docData.parteFatoData}
                            onChange={(e) => handleFieldChange("parteFatoData", e.target.value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Hora do Fato</label>
                          <Input 
                            value={docData.parteFatoHora}
                            onChange={(e) => handleFieldChange("parteFatoHora", e.target.value)}
                            placeholder="HH:MM"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Local do Fato
                        </label>
                        <Input 
                          value={docData.parteFatoLocal}
                          onChange={(e) => handleFieldChange("parteFatoLocal", e.target.value)}
                          placeholder="Ex: Pátio do CFAP"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> Considerando e solicitação
                        </label>
                        <Textarea 
                          value={docData.parteRelato}
                          onChange={(e) => handleFieldChange("parteRelato", e.target.value)}
                          placeholder="Digite o texto do considerando e da solicitação da parte..."
                          rows={8}
                        />
                        {parteConsiderandoCount > 5 && (
                          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                            A Parte ultrapassou 5 considerandos. Revise o texto antes de imprimir.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Fecho</label>
                        <Input
                          value={docData.parteFecho}
                          onChange={(e) => handleFieldChange("parteFecho", e.target.value)}
                          placeholder="Ex: Respeitosamente,"
                        />
                      </div>
                    </>
                  )}

                  {/* Campos específicos do REQUERIMENTO */}
                  {docType === "requerimento" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Nome Completo do Aluno</label>
                          <Input 
                            value={docData.reqNomeCompleto}
                            onChange={(e) => handleFieldChange("reqNomeCompleto", e.target.value)}
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Matrícula / RG</label>
                          <Input 
                            value={docData.reqMatricula}
                            onChange={(e) => handleFieldChange("reqMatricula", e.target.value)}
                            placeholder="XXX.XXX-X"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Companhia / Pelotão</label>
                        <Input 
                          value={docData.reqPelotao}
                          onChange={(e) => handleFieldChange("reqPelotao", e.target.value)}
                          placeholder="Ex: 3º Pelotão - 1ª Companhia"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground font-bold">Objeto do Requerimento</label>
                        <Input 
                          value={docData.reqSolicitacao}
                          onChange={(e) => handleFieldChange("reqSolicitacao", e.target.value)}
                          placeholder="Ex: Segunda chamada de prova"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Exposição de Motivos (Fundamentação)</label>
                        <Textarea 
                          value={docData.reqJustificativa}
                          onChange={(e) => handleFieldChange("reqJustificativa", e.target.value)}
                          placeholder="Explique detalhadamente o pedido..."
                          rows={8}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos específicos da DEFESA */}
                  {docType === "defesa" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Fato Apontado Referente (Nº do Registro)</label>
                        <Input 
                          value={docData.defesaFatoRef}
                          onChange={(e) => handleFieldChange("defesaFatoRef", e.target.value)}
                          placeholder="Ex: FAT-048/2026 ou Registro de Ocorrência Nº 12/2026"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Justificativa e Alegações de Defesa</label>
                        <Textarea 
                          value={docData.defesaTexto}
                          onChange={(e) => handleFieldChange("defesaTexto", e.target.value)}
                          placeholder="Apresente suas alegações de defesa baseadas nas circunstâncias justificantes ou atenuantes..."
                          rows={10}
                        />
                      </div>
                    </>
                  )}

                  {/* Campos específicos da GUIA */}
                  {docType === "guia" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Cidade e Estado de Destino
                        </label>
                        <Input 
                          value={docData.guiaDestino}
                          onChange={(e) => handleFieldChange("guiaDestino", e.target.value)}
                          placeholder="Ex: Parintins - AM"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Data de Ida</label>
                          <Input 
                            value={docData.guiaIda}
                            onChange={(e) => handleFieldChange("guiaIda", e.target.value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Data de Volta</label>
                          <Input 
                            value={docData.guiaVolta}
                            onChange={(e) => handleFieldChange("guiaVolta", e.target.value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Meio de Transporte</label>
                        <Input 
                          value={docData.guiaTransporte}
                          onChange={(e) => handleFieldChange("guiaTransporte", e.target.value)}
                          placeholder="Ex: Transporte aéreo / rodoviário / hidroviário"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Motivo do Deslocamento</label>
                        <Textarea 
                          value={docData.guiaMotivo}
                          onChange={(e) => handleFieldChange("guiaMotivo", e.target.value)}
                          placeholder="Exponha os motivos que ensejam a viagem..."
                          rows={6}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button 
                  onClick={handlePrint} 
                  className="bg-[#c4a84b] hover:bg-[#b39740] text-[#1a1a1a] font-bold w-full gap-2 mt-4"
                >
                  <Printer className="h-5 w-5" />
                  Imprimir / Salvar PDF
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Document Preview Side (A4 Sheet Simulation) */}
          <div className={`lg:col-span-7 flex justify-center print:block ${viewMode === "edit" ? "hidden lg:flex" : "flex"}`}>
            <div 
              id="military-document-print" 
              className="bg-white text-black shadow-2xl border border-gray-200 p-[30mm] pt-[20mm] pb-[20mm] w-[210mm] min-h-[297mm] flex flex-col items-center justify-between font-serif text-[13px] leading-relaxed relative print:shadow-none print:border-none print:p-0 print:w-full print:min-h-0 print:bg-white"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Estilos CSS específicos de impressão injetados */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body {
                    background-color: white !important;
                    color: black !important;
                    font-family: 'Times New Roman', Times, serif !important;
                  }
                  header, footer, nav, button, .print\\:hidden, #nprogress {
                    display: none !important;
                  }
                  .container {
                    max-width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  main {
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  #military-document-print {
                    width: 100% !important;
                    min-height: 100% !important;
                    padding: 30mm 20mm 20mm 30mm !important; /* Margens oficiais: Esquerda 3cm, Direita 2cm, Superior 3cm, Inferior 2cm */
                    border: none !important;
                    box-shadow: none !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                  }
                }
              `}} />

              {docType === "parte" ? (
                <ParteOfficialPreview docData={docData} />
              ) : (
                <>
              {/* Top Section / Header */}
              <div className="w-full flex flex-col items-center text-center gap-1.5 border-b-2 border-black pb-4">
                <img 
                  src={BRASAO_URL} 
                  alt="Brasão PMAM" 
                  className="w-[18mm] h-[18mm] object-contain mb-1" 
                />
                <h2 className="text-[12px] font-bold tracking-wider uppercase m-0 leading-tight">
                  ESTADO DO AMAZONAS
                </h2>
                <h3 className="text-[12px] font-bold tracking-wider uppercase m-0 leading-tight">
                  POLÍCIA MILITAR DO AMAZONAS
                </h3>
                <h4 className="text-[11px] font-bold tracking-wider uppercase m-0 leading-tight">
                  CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS - CFAP
                </h4>
              </div>

              {/* Document Title / Meta */}
              <div className="w-full mt-8 flex flex-col items-center">
                <span className="font-bold text-[14px] uppercase tracking-widest decoration-dotted underline underline-offset-4">
                  {docType === "requerimento" && "REQUERIMENTO ADMINISTRATIVO"}
                  {docType === "defesa" && "JUSTIFICATIVA E APRESENTAÇÃO DE DEFESA"}
                  {docType === "guia" && "SOLICITAÇÃO DE GUIA DE TRÂNSITO"}
                </span>
                <span className="text-[11px] text-gray-600 mt-1">
                  Cód: {docType.toUpperCase()}-CFAP-{new Date().getFullYear()}
                </span>
              </div>

              {/* Document Body */}
              <div className="w-full flex-1 mt-10 text-justify flex flex-col gap-6 text-[13px] leading-relaxed">
                
                {/* Remetente & Destinatário Block */}
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="font-bold">De: </span>
                    <span className="uppercase">{docData.remetente || "________________________"}</span>
                  </div>
                  <div>
                    <span className="font-bold">Para: </span>
                    <span className="uppercase font-semibold">{docData.destinatario || "________________________"}</span>
                  </div>
                  <div>
                    <span className="font-bold">Assunto: </span>
                    <span>{docData.assunto || "________________________"}</span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-gray-200 my-2" />

                {/* DYNAMIC TEXT BODY BASED ON DOC TYPE */}
                {docType === "requerimento" && (
                  <div className="flex flex-col gap-4">
                    <p className="indent-8 leading-relaxed text-justify">
                      O requerente <span className="font-bold uppercase">{docData.reqNomeCompleto || "________________________"}</span>, 
                      inscrito sob matrícula/RG <span className="font-bold">{docData.reqMatricula || "___________"}</span>, 
                      atualmente discente lotado no <span className="font-bold">{docData.reqPelotao || "___________"}</span>, 
                      vem mui respeitosamente, por meio deste instrumento, requerer a Vossa Senhoria o que segue:
                    </p>
                    <p className="font-bold text-center text-[13px] my-2 bg-gray-100 p-2 uppercase print:bg-transparent print:border print:p-1">
                      {docData.reqSolicitacao || "NENHUMA SOLICITAÇÃO ESPECIFICADA"}
                    </p>
                    <p className="font-bold uppercase text-[11px] tracking-wider mb-0 text-gray-700 print:text-black">Fundamentação / Justificativa:</p>
                    <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200 print:bg-transparent print:border-none print:p-0">
                      {docData.reqJustificativa || "Preencha a exposição de motivos no formulário ao lado."}
                    </p>
                    <p className="indent-8 leading-relaxed text-justify">
                      Nestes termos, pede e aguarda deferimento.
                    </p>
                  </div>
                )}

                {docType === "defesa" && (
                  <div className="flex flex-col gap-4">
                    <p className="indent-8 leading-relaxed text-justify">
                      1. Em atenção à notificação de fato apontado sob registro sob número 
                      <span className="font-bold"> {docData.defesaFatoRef || "______________"}</span>, o discente acima qualificado apresenta tempestivamente suas alegações de defesa e justificativa de conduta, nos termos que seguem:
                    </p>
                    <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200 print:bg-transparent print:border-none print:p-0">
                      {docData.defesaTexto || "Insira o texto das alegações de defesa no formulário de edição."}
                    </p>
                    <p className="indent-8 leading-relaxed text-justify">
                      2. Diante do exposto, solicita-se a análise do Colegiado Escolar ou do Comando de Companhia para acolhimento das justificativas apresentadas, visando a desconsideração ou mitigação dos pontos na Ficha de Conduta Escolar.
                    </p>
                  </div>
                )}

                {docType === "guia" && (
                  <div className="flex flex-col gap-4">
                    <p className="indent-8 leading-relaxed text-justify">
                      1. Solicito a V.S.ª a emissão de Guia de Trânsito para viagem regulamentar com destino à cidade de 
                      <span className="font-bold"> {docData.guiaDestino || "_______________"}</span>, 
                      com afastamento previsto a iniciar no dia <span className="font-bold">{docData.guiaIda || "__/__/____"}</span> 
                      e retorno previsto para o dia <span className="font-bold">{docData.guiaVolta || "__/__/____"}</span>, 
                      utilizando para tanto o seguinte meio de locomoção: <span className="font-bold">{docData.guiaTransporte || "_______________"}</span>.
                    </p>
                    <p className="font-bold uppercase text-[11px] tracking-wider mb-0 text-gray-700 print:text-black">Motivo do Deslocamento:</p>
                    <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200 print:bg-transparent print:border-none print:p-0">
                      {docData.guiaMotivo || "Descreva o motivo da viagem no editor ao lado."}
                    </p>
                    <p className="indent-8 leading-relaxed text-justify">
                      2. Declaro estar ciente dos preceitos disciplinares e de apresentação individual do CFAP durante todo o trânsito, comprometendo-me a portar a referida Guia de Trânsito assinada durante o deslocamento.
                    </p>
                  </div>
                )}

              </div>

              {/* Bottom Section / Signatures */}
              <div className="w-full flex flex-col items-center gap-10 mt-12">
                <div className="w-full text-right font-medium">
                  {docData.localData || "Manaus - AM"}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-[80mm] h-[1px] bg-black" />
                  <span className="uppercase font-bold mt-2 text-[12px] tracking-wide text-center">
                    {docData.remetente || "Assinatura do Discente"}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                    Signatário
                  </span>
                </div>
              </div>
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
