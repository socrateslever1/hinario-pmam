import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
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
  Download,
  X
} from "lucide-react";
import { toast } from "sonner";
import { getStudentSession } from "@/lib/studentSession";
import { trpc } from "@/lib/trpc";
import { useModalHistory } from "@/hooks/useModalHistory";

const PMAM_HEADER_URL = "/logo/IMG_7728.PNG";
const CFAP_HEADER_URL = "/documents/images/brasao_cfap.png";

type DocType = "parte" | "requerimento" | "defesa" | "guia";

interface DocumentData {
  type: DocType;
  // Campos Gerais
  remetente: string;
  destinatario: string;
  assunto: string;
  anexo: string;
  localData: string;
  imagemCabecalhoEsq?: string | null;
  imagemCabecalhoDir?: string | null;
  assinaturaDigital?: string | null;
  assinaturaNome?: string;
  assinadoEm?: string | Date | null;
  tipoParte?: string;
  anexosBase64?: string[];
  
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
    guiaTransporte: "",
    anexosBase64: []
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
    guiaTransporte: "",
    anexosBase64: []
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
    guiaTransporte: "",
    anexosBase64: []
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
    anexosBase64: []
  }
};

export function formatParteDate(localData: string) {
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

export function ParteOfficialPreview({ docData }: { docData: DocumentData }) {
  const remetente = docData.remetente || "AL SD PM (1111) FULANO (CI 11111)";
  const destinatario = docData.destinatario || "CAP QOPM Cmt do CAL";
  const assunto = docData.assunto || "Solicitação (FAZ)";
  const relato = docData.parteRelato || PARTE_DEFAULT_RELATO;
  const fecho = docData.parteFecho || "Respeitosamente,";

  return (
    <div
      className="official-document-sheet relative flex h-full flex-1 w-full flex-col text-[12pt] leading-[1.5] [color-scheme:light]"
    >
      <div className="relative mb-8 min-h-[31mm] shrink-0 text-center font-serif text-black">
        <img
          src={docData.imagemCabecalhoEsq || PMAM_HEADER_URL}
          alt="Brasão PMAM"
          className="absolute left-0 top-0 h-[26mm] w-[26mm] object-contain"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />
        <div className="mx-auto max-w-[120mm] pt-1 uppercase leading-tight text-gray-700">
          <p>POLÍCIA MILITAR DO AMAZONAS</p>
          <p>DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</p>
          <p>CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</p>
          <p className="text-[24px] font-bold leading-none">CFAP</p>
        </div>
        <img
          src={docData.imagemCabecalhoDir || CFAP_HEADER_URL}
          alt="Brasão CFAP"
          className="absolute right-0 top-0 h-[26mm] w-[31mm] object-contain"
          style={{ imageRendering: "-webkit-optimize-contrast" }}
        />
      </div>

      <section className="flex justify-between text-black mt-2">
        <p>Parte S/Nº/2026</p>
        <p className="text-right">Quartel em Manaus-AM, {formatParteDate(docData.localData)}.</p>
      </section>

      <section className="mt-3 leading-[1.5] text-black text-right">
        <p><strong>Do:</strong> {remetente}</p>
        <p><strong>Ao:</strong> {destinatario}</p>
        <p><strong>Assunto:</strong> {assunto}</p>
        {docData.anexo && <p><strong>Anexo:</strong> {docData.anexo}</p>}
      </section>

      <main className="mt-10 flex-1 text-justify text-black">
        <p className="mb-[8pt] indent-[15mm]">Senhor Comandante,</p>
        {relato.split('\n').filter((p: string) => p.trim() !== '').map((paragraph, index) => (
          <p key={index} className="mb-[8pt] indent-[15mm]">
            {paragraph}
          </p>
        ))}
        <p className="mt-10 mb-[8pt] indent-[15mm]">{fecho}</p>
      </main>

      <section className="mt-auto mb-[13mm] flex shrink-0 flex-col items-center text-center text-black relative">
        <div className="mb-2 w-[80mm] border-t border-black" />
        <p className="font-bold uppercase">{docData.assinaturaNome || remetente}</p>
        <p>Solicitante</p>
        {docData.assinaturaDigital && (
          <div className="mt-2 rounded border border-green-600/30 bg-green-50/50 px-3 py-1.5 text-center text-[10px] text-green-800 font-mono flex flex-col items-center gap-0.5 print:bg-transparent print:border-green-800">
            <span className="font-bold tracking-wider uppercase text-green-900 print:text-green-800 flex items-center gap-0.5 mb-1">
              🛡️ ASSINATURA ELETRÔNICA REGISTRADA
            </span>
            {docData.assinaturaDigital.includes(" | ") ? (
              docData.assinaturaDigital.split(" | ").map((part: string, i: number) => (
                <span key={i} className="block">{part}</span>
              ))
            ) : (
              <span>{docData.assinaturaDigital}</span>
            )}
            {docData.assinadoEm && <span>Data/Hora: {new Date(docData.assinadoEm).toLocaleString("pt-BR")}</span>}
          </div>
        )}
      </section>

      <div className="absolute inset-x-0 bottom-0 border-t border-double border-black pt-1 text-center text-[9px] leading-tight text-gray-600">
        <p className="font-bold">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS - CFAP</p>
        <p>Rua Benjamin Constant, 2150 - Petrópolis, Manaus - AM, CEP: 69063-010</p>
        <p>cfap@pm.am.gov.br</p>
      </div>
    </div>
  );
}

export function RenderSavedDocument({ doc }: { doc: any }) {
  let data: any = {};
  try {
    data = JSON.parse(doc.conteudoJson);
  } catch (e) {
    data = {};
  }
  
  if (doc.tipoDocumento === 'parte') {
    return (
      <>
        <div 
          className="official-document-sheet relative flex h-[297mm] flex-col text-[12pt] leading-[1.5] text-black text-left bg-white border border-gray-200 shadow-2xl pb-[20mm] pl-[30mm] pr-[20mm] pt-[30mm] font-serif shrink-0 print:border-none print:shadow-none print:p-0"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            width: "210mm",
            minWidth: "210mm",
            height: "297mm",
            minHeight: "297mm",
            boxSizing: "border-box",
          }}
        >
          <div className="relative mb-8 min-h-[31mm] shrink-0 text-center font-serif">
            <img
              src={doc.imagemCabecalhoEsq || PMAM_HEADER_URL}
              alt="Brasão PMAM"
              className="absolute left-0 top-0 h-[26mm] w-[26mm] object-contain"
            />
            <div className="mx-auto max-w-[120mm] pt-1 uppercase leading-tight text-gray-700">
              <p>POLÍCIA MILITAR DO AMAZONAS</p>
              <p>DIRETORIA DE CAPACITAÇÃO E TREINAMENTO</p>
              <p>CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS</p>
              <p className="text-[24px] font-bold leading-none">CFAP</p>
            </div>
            <img
              src={doc.imagemCabecalhoDir || CFAP_HEADER_URL}
              alt="Brasão CFAP"
              className="absolute right-0 top-0 h-[26mm] w-[31mm] object-contain"
            />
          </div>

          <section className="flex justify-between mt-2">
            <p>Parte S/Nº/2026</p>
            <p className="text-right">Quartel em Manaus-AM, {formatParteDate(data.localData || doc.localData)}.</p>
          </section>

          <section className="mt-3 leading-[1.5] text-right">
            <p><strong>Do:</strong> {doc.remetente}</p>
            <p><strong>Ao:</strong> {doc.destinatario}</p>
            <p><strong>Assunto:</strong> {doc.assunto}</p>
            {doc.anexo && <p><strong>Anexo:</strong> {doc.anexo}</p>}
          </section>

          <main className="mt-10 flex-1 whitespace-pre-line text-justify">
            <p className="mb-[8pt] indent-[15mm]">Senhor Comandante,</p>
            {(data.parteRelato || "").split('\n').filter((p: string) => p.trim() !== "").map((paragraph: string, index: number) => (
              <p key={index} className="mb-[8pt] indent-[15mm]">
                {paragraph}
              </p>
            ))}
            <p className="mt-10 mb-[8pt] indent-[15mm]">{data.parteFecho || "Respeitosamente,"}</p>
          </main>

          <section className="mt-auto mb-[13mm] flex shrink-0 flex-col items-center text-center relative">
            <div className="mb-2 w-[80mm] border-t border-black" />
            <p className="font-bold uppercase">{doc.assinaturaNome || doc.remetente}</p>
            <p>Solicitante</p>
            {doc.assinaturaDigital && (
              <div className="mt-2 rounded border border-green-800 bg-green-50/50 px-3 py-1.5 text-center text-[10px] text-green-800 font-mono flex flex-col items-center gap-0.5">
                <span className="font-bold tracking-wider uppercase text-green-900 mb-1">
                  🛡️ ASSINATURA ELETRÔNICA REGISTRADA
                </span>
                {doc.assinaturaDigital.includes(" | ") ? (
                  doc.assinaturaDigital.split(" | ").map((part: string, i: number) => (
                    <span key={i} className="block">{part}</span>
                  ))
                ) : (
                  <span>{doc.assinaturaDigital}</span>
                )}
                {doc.assinadoEm && <span>Data/Hora: {new Date(doc.assinadoEm).toLocaleString("pt-BR")}</span>}
              </div>
            )}
          </section>

          <div className="absolute inset-x-0 bottom-0 border-t border-double border-black pt-1 text-center text-[9px] leading-tight text-gray-600">
            <p className="font-bold">CENTRO DE FORMAÇÃO E APERFEIÇOAMENTO DE PRAÇAS - CFAP</p>
            <p>Rua Benjamin Constant, 2150 - Petrópolis, Manaus - AM, CEP: 69063-010</p>
            <p>cfap@pm.am.gov.br</p>
          </div>
        </div>
        {data.anexosBase64 && data.anexosBase64.length > 0 && (
          <RenderDocumentAttachments 
            anexos={data.anexosBase64} 
            remetente={doc.remetente} 
            docType={doc.tipoDocumento} 
          />
        )}
      </>
    );
  } else {
    return (
      <>
        <div 
          className="official-document-sheet relative flex h-[297mm] flex-col text-[12pt] leading-[1.5] text-black text-left bg-white border border-gray-200 shadow-2xl pb-[20mm] pl-[30mm] pr-[20mm] pt-[30mm] font-serif shrink-0 print:border-none print:shadow-none print:p-0"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            width: "210mm",
            minWidth: "210mm",
            height: "297mm",
            minHeight: "297mm",
            boxSizing: "border-box",
          }}
        >
          <div className="w-full flex flex-col items-center text-center gap-1.5 border-b-2 border-black pb-4">
            <img 
              src={doc.imagemCabecalhoEsq || PMAM_HEADER_URL} 
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

          <div className="w-full mt-8 flex flex-col items-center">
            <span className="font-bold text-[14px] uppercase tracking-widest decoration-dotted underline underline-offset-4">
              {doc.tipoDocumento === "requerimento" && "REQUERIMENTO ADMINISTRATIVO"}
              {doc.tipoDocumento === "defesa" && "JUSTIFICATIVA E APRESENTAÇÃO DE DEFESA"}
              {doc.tipoDocumento === "guia" && "SOLICITAÇÃO DE GUIA DE TRÂNSITO"}
            </span>
            <span className="text-[11px] text-gray-600 mt-1">
              Cód: {doc.tipoDocumento.toUpperCase()}-CFAP-{new Date(doc.createdAt).getFullYear()}
            </span>
          </div>

          <div className="w-full flex-1 mt-10 text-justify flex flex-col gap-6 text-[13px] leading-relaxed">
            <div className="flex flex-col gap-1.5">
              <div>
                <span className="font-bold">De: </span>
                <span className="uppercase">{doc.remetente}</span>
              </div>
              <div>
                <span className="font-bold">Para: </span>
                <span className="uppercase font-semibold">{doc.destinatario}</span>
              </div>
              <div>
                <span className="font-bold">Assunto: </span>
                <span>{doc.assunto}</span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-gray-200 my-2" />

            {doc.tipoDocumento === "requerimento" && (
              <div className="flex flex-col gap-4">
                <p className="indent-8 leading-relaxed text-justify">
                  O requerente <span className="font-bold uppercase">{data.reqNomeCompleto || "________________________"}</span>, 
                  inscrito sob matrícula/RG <span className="font-bold">{data.reqMatricula || "___________"}</span>, 
                  atualmente discente lotado no <span className="font-bold">{data.reqPelotao || "___________"}</span>, 
                  vem mui respeitosamente, por meio deste instrumento, requerer a Vossa Senhoria o que segue:
                </p>
                <p className="font-bold text-center text-[13px] my-2 bg-gray-100 p-2 uppercase">
                  {data.reqSolicitacao || "NENHUMA SOLICITAÇÃO ESPECIFICADA"}
                </p>
                <p className="font-bold uppercase text-[11px] tracking-wider mb-0 text-gray-700">Fundamentação / Justificativa:</p>
                <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200">
                  {data.reqJustificativa}
                </p>
                <p className="indent-8 leading-relaxed text-justify">
                  Nestes termos, pede e aguarda deferimento.
                </p>
              </div>
            )}

            {doc.tipoDocumento === "defesa" && (
              <div className="flex flex-col gap-4">
                <p className="indent-8 leading-relaxed text-justify">
                  1. Em atenção à notificação de fato apontado sob registro sob número 
                  <span className="font-bold"> {data.defesaFatoRef}</span>, o discente acima qualificado apresenta tempestivamente suas alegações de defesa e justificativa de conduta, nos termos que seguem:
                </p>
                <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200">
                  {data.defesaTexto}
                </p>
                <p className="indent-8 leading-relaxed text-justify">
                  2. Diante do exposto, solicita-se a análise do Colegiado Escolar ou do Comando de Companhia para acolhimento das justificativas apresentadas, visando a desconsideração ou mitigação dos pontos na Ficha de Conduta Escolar.
                </p>
              </div>
            )}

            {doc.tipoDocumento === "guia" && (
              <div className="flex flex-col gap-4">
                <p className="indent-8 leading-relaxed text-justify">
                  1. Solicito a V.S.ª a emissão de Guia de Trânsito para viagem regulamentar com destino à cidade de 
                  <span className="font-bold"> {data.guiaDestino}</span>, 
                  com afastamento previsto a iniciar no dia <span className="font-bold">{data.guiaIda}</span> 
                  e retorno previsto para o dia <span className="font-bold">{data.guiaVolta}</span>, 
                  utilizando para tanto o seguinte meio de locomoção: <span className="font-bold">{data.guiaTransporte}</span>.
                </p>
                <p className="font-bold uppercase text-[11px] tracking-wider mb-0 text-gray-700">Motivo do Deslocamento:</p>
                <p className="indent-8 whitespace-pre-line leading-relaxed text-justify bg-gray-50/50 p-4 rounded border border-dashed border-gray-200">
                  {data.guiaMotivo}
                </p>
                <p className="indent-8 leading-relaxed text-justify">
                  2. Declaro estar ciente dos preceitos disciplinares e de apresentação individual do CFAP durante todo o trânsito, comprometendo-me a portar a referida Guia de Trânsito assinada durante o deslocamento.
                </p>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col items-center gap-10 mt-12">
            <div className="w-full text-right font-medium">
              {doc.localData || "Manaus - AM"}
            </div>
            <div className="flex flex-col items-center">
              <div className="w-[80mm] h-[1px] bg-black" />
              <span className="uppercase font-bold mt-2 text-[12px] tracking-wide text-center">
                {doc.assinaturaNome || doc.remetente}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                Signatário
              </span>
              {doc.assinaturaDigital && (
                <div className="mt-2 rounded border border-green-800 bg-green-50/50 px-3 py-1.5 text-center text-[10px] text-green-800 font-mono flex flex-col items-center gap-0.5">
                  <span className="font-bold tracking-wider uppercase text-green-900">
                    🛡️ ASSINATURA ELETRÔNICA REGISTRADA
                  </span>
                  {doc.assinaturaDigital.includes(" | ") ? (
                    doc.assinaturaDigital.split(" | ").map((part: string, i: number) => (
                      <span key={i} className="block">{part}</span>
                    ))
                  ) : (
                    <span>{doc.assinaturaDigital}</span>
                  )}
                  {doc.assinadoEm && <span>Data/Hora: {new Date(doc.assinadoEm).toLocaleString("pt-BR")}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        {data.anexosBase64 && data.anexosBase64.length > 0 && (
          <RenderDocumentAttachments 
            anexos={data.anexosBase64} 
            remetente={doc.remetente} 
            docType={doc.tipoDocumento} 
          />
        )}
      </>
    );
  }
}

function formatSender(numerica: string, nomeCompleto: string, nomeGuerra: string, rg: string) {
  const cleanNome = (nomeGuerra || "").toUpperCase();
  return `Al. Sd. PM Nº ${numerica} ${cleanNome}`;
}

function getShortDeviceDesc(ua: string) {
  let os = "OS Desconhecido";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Navegador Desconhecido";
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/edge|edg/i.test(ua)) browser = "Edge";
  else if (/opr/i.test(ua)) browser = "Opera";

  return `${browser} no ${os}`;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Erro ao carregar imagem para compressão"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

export function RenderDocumentAttachments({ anexos, remetente, docType }: { anexos?: string[], remetente: string, docType: string }) {
  if (!anexos || anexos.length === 0) return null;
  return (
    <>
      {anexos.map((imgBase64, index) => (
        <div
          key={index}
          className="official-document-sheet relative flex flex-col items-center justify-center p-[20mm] bg-white border border-gray-200 shadow-2xl min-w-[210mm] min-h-[297mm] w-[210mm] h-[297mm] break-before-page page-break-before-always text-black shrink-0 mt-6 print:mt-0 print:border-none print:shadow-none print:p-0"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            width: "210mm",
            height: "297mm",
            boxSizing: "border-box",
          }}
        >
          <div className="absolute top-[10mm] left-[30mm] right-[20mm] border-b pb-1 text-[11px] text-gray-500 font-sans flex justify-between items-center print:top-[30mm] print:left-[30mm] print:right-[20mm]">
            <span className="font-bold uppercase">POLÍCIA MILITAR DO AMAZONAS — CFAP</span>
            <span>ANEXO #{index + 1} AO DOCUMENTO ({docType.toUpperCase()})</span>
          </div>
          
          <div className="w-full h-full flex items-center justify-center pt-8 pb-4">
            <img
              src={imgBase64}
              alt={`Anexo ${index + 1}`}
              className="max-w-full max-h-[230mm] object-contain border"
            />
          </div>
          
          <div className="absolute bottom-[10mm] left-[30mm] right-[20mm] border-t pt-1 text-[10px] text-gray-400 font-sans text-center print:bottom-[20mm] print:left-[30mm] print:right-[20mm]">
            Signatário do Documento: {remetente}
          </div>
        </div>
      ))}
    </>
  );
}

export default function Documents() {
  const [, setLocation] = useLocation();
  const session = getStudentSession();

  // Redireciona para o login caso o usuário tente acessar a página sem autenticação
  useEffect(() => {
    if (!session) {
      setLocation("/entrar");
    }
  }, [session, setLocation]);

  const [docType, setDocType] = useState<DocType>("parte");
  const [docData, setDocData] = useState<DocumentData>(defaultValues.parte);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [activeTab, setActiveTab] = useState("editor");
  const parteConsiderandoCount = countParteConsiderandos(docData.parteRelato);

  // Estado para controlar qual documento visualizar no Dialog de salvos
  const [viewDoc, setViewDoc] = useState<any | null>(null);

  // Escuta o botão voltar do navegador/celular para fechar o visualizador do documento sem fechar o PWA
  useModalHistory(Boolean(viewDoc), () => setViewDoc(null), "viewDoc");

  // Estado para controle de paginação na lista de enviados
  const [currentPage, setCurrentPage] = useState(1);

  // Resetar a página para 1 sempre que trocar o tipo de documento ou aba
  useEffect(() => {
    setCurrentPage(1);
  }, [docType, activeTab]);

  // Estados de busca de alunos
  const [searchNumerica, setSearchNumerica] = useState("");
  const [searchRgInput, setSearchRgInput] = useState("");
  const [searchRgQuery, setSearchRgQuery] = useState("");

  if (!session) return null;
  const profileQuery = trpc.student.getProfile.useQuery(
    { id: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );
  const officialDocumentsQuery = trpc.officialDocuments.list.useQuery();

  const minhasPartesQuery = trpc.documentosParte.listarMinhasPartes.useQuery(
    { studentId: session?.id ?? 0, sessionToken: session?.sessionToken ?? "" },
    { enabled: !!session }
  );

  const enviarParteMutation = trpc.documentosParte.criarEEnviar.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado via sistema com sucesso!");
      minhasPartesQuery.refetch();
      setActiveTab("enviados");
    },
    onError: (err: any) => {
      toast.error(`Erro ao enviar documento: ${err.message}`);
    }
  });

  // Query reativa para buscar aluno por numérica ou RG/CI
  const searchStudentQuery = trpc.student.getByNumericaOrRg.useQuery(
    {
      id: session?.id ?? 0,
      sessionToken: session?.sessionToken ?? "",
      numerica: searchNumerica || undefined,
      rg: searchRgQuery || undefined
    },
    {
      enabled: Boolean((searchNumerica && searchNumerica.length === 4) || (searchRgQuery && searchRgQuery.length >= 3)),
      retry: false,
    }
  );

  // Escutar sucesso na busca do discente
  useEffect(() => {
    if (searchStudentQuery.data) {
      const student = searchStudentQuery.data;
      const senderString = formatSender(
        student.numerica,
        student.nomeCompleto || "",
        student.nomeGuerra,
        student.rg || ""
      );
      
      const updated = { ...docData };
      updated.remetente = senderString;
      updated.assinaturaNome = student.nomeCompleto || student.nomeGuerra;
      
      if (docType === "requerimento") {
        updated.reqNomeCompleto = student.nomeCompleto || "";
        updated.reqMatricula = student.rg || "";
        updated.reqPelotao = `${student.peloton}º Pelotão - ${student.companhia}ª Companhia`;
      }
      
      setDocData(updated);
      localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(updated));
      toast.success(`Dados de ${student.nomeGuerra} importados com sucesso!`);
      
      // Limpar campos de busca
      setSearchNumerica("");
      setSearchRgInput("");
      setSearchRgQuery("");
    }
  }, [searchStudentQuery.data]);

  // Escutar erro na busca
  useEffect(() => {
    if (searchStudentQuery.error) {
      toast.error("Nenhum discente encontrado com esses dados.");
      setSearchNumerica("");
      setSearchRgInput("");
      setSearchRgQuery("");
    }
  }, [searchStudentQuery.error]);

  // Carregar dados salvos do localStorage ou mesclar com o perfil oficial
  useEffect(() => {
    const saved = localStorage.getItem(`pmam_doc_${docType}`);
    let initialData: DocumentData;
    
    if (saved) {
      try {
        initialData = normalizeDocumentData(docType, JSON.parse(saved));
      } catch (e) {
        initialData = { ...defaultValues[docType] };
      }
    } else {
      initialData = { ...defaultValues[docType] };
    }

    if (session && profileQuery.data) {
      const senderString = formatSender(
        session.numerica,
        profileQuery.data.nomeCompleto || "",
        profileQuery.data.nomeGuerra || session.nomeGuerra,
        profileQuery.data.rg || ""
      );
      
      // Auto-preencher remetente se for o padrão ou se estiver vazio ou antigo
      if (!initialData.remetente || initialData.remetente === defaultValues[docType].remetente || initialData.remetente.includes("1234 Silva") || initialData.remetente.includes("1234 SILVA")) {
        initialData.remetente = senderString;
      }
      // Sempre preencher assinaturaNome com o nome completo do perfil (pode ser editado depois)
      if (!initialData.assinaturaNome || initialData.assinaturaNome === defaultValues[docType].assinaturaNome) {
        initialData.assinaturaNome = profileQuery.data.nomeCompleto || profileQuery.data.nomeGuerra;
      }

      if (docType === "requerimento") {
        if (!initialData.reqNomeCompleto || initialData.reqNomeCompleto === defaultValues.requerimento.reqNomeCompleto) {
          initialData.reqNomeCompleto = profileQuery.data.nomeCompleto || "";
        }
        if (!initialData.reqMatricula || initialData.reqMatricula === defaultValues.requerimento.reqMatricula) {
          initialData.reqMatricula = profileQuery.data.rg || "";
        }
        if (!initialData.reqPelotao || initialData.reqPelotao === defaultValues.requerimento.reqPelotao) {
          initialData.reqPelotao = `${session.peloton}º Pelotão - ${session.companhia}ª Companhia`;
        }
      }
    }

    const normalized = normalizeDocumentData(docType, initialData);
    setDocData(normalized);
    localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(normalized));
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
    <div className="mobile-safe-bottom min-h-screen flex flex-col print:block print:min-h-0 print:bg-white bg-[#f5f2e8] md:bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white border-b border-border/40 px-4 pb-7 pt-6 print:hidden md:px-0 md:py-12">
        <div className="container text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-[#c4a84b]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a2a] dark:text-[#e2ca76]" style={{ fontFamily: "Merriweather, serif" }}>
            Gerador de Documentos Militares
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground text-sm md:text-base">
            Crie, formate e exporte documentos oficiais de acordo com os padrões regulamentares do RISG e do CFAP da Polícia Militar do Amazonas.
          </p>
        </div>
        <div className="checkerboard-pattern mt-8 hidden w-full md:block" />
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col print:block">
        <div className="bg-white border-b border-border/40 py-2 print:hidden">
          <div className="container flex justify-center">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-[#f5f2e8]/80">
              <TabsTrigger value="editor" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Criar Documento
              </TabsTrigger>
              <TabsTrigger value="enviados" className="gap-2" disabled={!session}>
                <ClipboardList className="h-4 w-4" />
                Partes Enviadas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="editor" className="flex-1 flex flex-col m-0 p-0 print:block">
          {/* Main Panel */}
          <main className="container flex-1 px-0 py-6 print:m-0 print:p-0 md:px-0 md:py-8">
            <div className="grid grid-cols-1 gap-4 px-4 print:block md:px-0 lg:grid-cols-12 lg:gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            <Card className="border-border/50 bg-card text-card-foreground shadow-md">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1a3a2a] dark:text-[#e2ca76]">Tipo de Documento</label>
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
                    className={`flex-1 gap-2 ${viewMode === "edit" ? "bg-[#1a3a2a] dark:bg-[#1a3a2a] text-white dark:text-[#e2ca76] hover:bg-[#1a3a2a]/90" : ""}`}
                    onClick={() => setViewMode("edit")}
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button 
                    variant={viewMode === "preview" ? "default" : "outline"} 
                    className={`flex-1 gap-2 lg:hidden ${viewMode === "preview" ? "bg-[#1a3a2a] dark:bg-[#1a3a2a] text-white dark:text-[#e2ca76] hover:bg-[#1a3a2a]/90" : ""}`}
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {officialDocumentsQuery.data && officialDocumentsQuery.data.length > 0 && (
              <Card className="border-border/50 bg-card text-card-foreground shadow-md">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Download className="h-5 w-5 text-[#c4a84b]" />
                    <h3 className="text-base font-bold text-[#1a3a2a] dark:text-[#e2ca76]" style={{ fontFamily: "Inter, sans-serif" }}>
                      Documentos oficiais
                    </h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {officialDocumentsQuery.data.map((item) => {
                      const extension = item.fileName.split(".").pop()?.toUpperCase() || "DOC";
                      return (
                        <div key={item.id} className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a]/10 text-[10px] font-bold text-[#1a3a2a] dark:text-[#e2ca76]">
                            {extension.slice(0, 4)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {item.description || item.fileName}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline" className="h-8 shrink-0 gap-1 bg-white text-foreground">
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" download={item.fileName}>
                              <Download className="h-3.5 w-3.5" />
                              Baixar
                            </a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inputs Editor */}
            <Card className="flex-1 border-border/50 bg-card text-card-foreground shadow-md">
              <CardContent className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-[#1a3a2a] dark:text-[#e2ca76] text-base" style={{ fontFamily: "Inter, sans-serif" }}>
                    Preencher Dados
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive gap-1 px-2 h-8">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                </div>

                {/* Busca e Importação Rápida */}
                <div className="flex flex-col gap-3 rounded-lg border border-[#c4a84b]/20 bg-[#c4a84b]/5 p-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a3a2a] dark:text-[#e2ca76]">Busca e Importação Rápida</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-foreground/70">Numérica (4 dígitos)</label>
                      <Input
                        placeholder="Ex: 4122"
                        value={searchNumerica}
                        maxLength={4}
                        className="h-8 text-xs bg-white text-black"
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setSearchNumerica(val);
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-foreground/70">CI / RG</label>
                      <Input
                        placeholder="Ex: 27666"
                        value={searchRgInput}
                        className="h-8 text-xs bg-white text-black"
                        onChange={(e) => setSearchRgInput(e.target.value)}
                        onBlur={() => {
                          if (searchRgInput.trim().length >= 3) {
                            setSearchRgQuery(searchRgInput.trim());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (searchRgInput.trim().length >= 3) {
                              setSearchRgQuery(searchRgInput.trim());
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    * Ao preencher a numérica ou RG/CI, os campos da Parte e Requerimento serão atualizados automaticamente.
                  </p>
                </div>

                <div className="flex flex-col gap-4 max-h-[75vh] lg:max-h-[85vh] overflow-y-auto pr-2 pb-10 pt-2">
                  {/* ① Local e Data — aparece no topo do documento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> Local e Data
                    </label>
                    <Input 
                      value={docData.localData}
                      onChange={(e) => handleFieldChange("localData", e.target.value)}
                      placeholder="Manaus - AM, DD/MM/AAAA"
                    />
                  </div>

                  {/* ② Remetente */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/70">
                      <span className="flex items-center gap-1 flex-wrap">
                        <User className="h-3 w-3 shrink-0" />
                        <span>Remetente — Identidade Militar</span>
                      </span>
                    </label>
                    <Input 
                      value={docData.remetente}
                      onChange={(e) => handleFieldChange("remetente", e.target.value)}
                      placeholder="Ex: Al. Sd. PM Nº 1234 SILVA (CI 12345)"
                    />
                  </div>

                  {/* ③ Destinatário */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" /> Destinatário
                    </label>
                    <Input 
                      value={docData.destinatario}
                      onChange={(e) => handleFieldChange("destinatario", e.target.value)}
                      placeholder="Ex: Ao Sr. Cmt da Cia de Alunos do CFAP"
                    />
                  </div>

                  {/* ④ Assunto */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                      <FileText className="h-3 w-3 shrink-0" /> Assunto
                    </label>
                    <Input
                      value={docData.assunto}
                      onChange={(e) => handleFieldChange("assunto", e.target.value)}
                      placeholder="Ex: Solicitação (FAZ)"
                    />
                  </div>

                  {/* ⑤ Anexo — só na Parte */}
                  {docType === "parte" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                        <FileText className="h-3 w-3 shrink-0" /> Anexo
                      </label>
                      <Input
                        value={docData.anexo}
                        onChange={(e) => handleFieldChange("anexo", e.target.value)}
                        placeholder="___ (Se houver)"
                      />
                    </div>
                  )}

                  {/* ⑥⑦ Considerandos e Fecho — só na Parte */}
                  {docType === "parte" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                            <ClipboardList className="h-3 w-3 shrink-0" /> Fato, Considerandos e Solicitação
                          </label>
                          <div className="flex gap-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 text-[10px] px-2 bg-white"
                              onClick={() => {
                                const current = docData.parteRelato || "";
                                const prefix = current.length > 0 ? (current.endsWith("\n") ? "" : "\n") : "";
                                handleFieldChange("parteRelato", current + prefix + "Considerando que ");
                              }}
                            >
                              + Considerando
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-6 text-[10px] px-2 bg-white"
                              onClick={() => handleFieldChange("parteRelato", docData.parteRelato + (docData.parteRelato ? "\n" : "") + "Solicito a V.S.ª a possibilidade de ")}
                            >
                              + Solicitação
                            </Button>
                          </div>
                        </div>
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
                        <label className="text-xs font-semibold text-foreground/70">Fecho</label>
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
                          <label className="text-xs font-semibold text-foreground/70">Nome Completo do Aluno</label>
                          <Input 
                            value={docData.reqNomeCompleto}
                            onChange={(e) => handleFieldChange("reqNomeCompleto", e.target.value)}
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-foreground/70">Matrícula / RG</label>
                          <Input 
                            value={docData.reqMatricula}
                            onChange={(e) => handleFieldChange("reqMatricula", e.target.value)}
                            placeholder="XXX.XXX-X"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Companhia / Pelotão</label>
                        <Input 
                          value={docData.reqPelotao}
                          onChange={(e) => handleFieldChange("reqPelotao", e.target.value)}
                          placeholder="Ex: 3º Pelotão - 1ª Companhia"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70 font-bold">Objeto do Requerimento</label>
                        <Input 
                          value={docData.reqSolicitacao}
                          onChange={(e) => handleFieldChange("reqSolicitacao", e.target.value)}
                          placeholder="Ex: Segunda chamada de prova"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Exposição de Motivos (Fundamentação)</label>
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
                        <label className="text-xs font-semibold text-foreground/70">Fato Apontado Referente (Nº do Registro)</label>
                        <Input 
                          value={docData.defesaFatoRef}
                          onChange={(e) => handleFieldChange("defesaFatoRef", e.target.value)}
                          placeholder="Ex: FAT-048/2026 ou Registro de Ocorrência Nº 12/2026"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Justificativa e Alegações de Defesa</label>
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
                        <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
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
                          <label className="text-xs font-semibold text-foreground/70">Data de Ida</label>
                          <Input 
                            value={docData.guiaIda}
                            onChange={(e) => handleFieldChange("guiaIda", e.target.value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-foreground/70">Data de Volta</label>
                          <Input 
                            value={docData.guiaVolta}
                            onChange={(e) => handleFieldChange("guiaVolta", e.target.value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Meio de Transporte</label>
                        <Input 
                          value={docData.guiaTransporte}
                          onChange={(e) => handleFieldChange("guiaTransporte", e.target.value)}
                          placeholder="Ex: Transporte aéreo / rodoviário / hidroviário"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/70">Motivo do Deslocamento</label>
                        <Textarea 
                          value={docData.guiaMotivo}
                          onChange={(e) => handleFieldChange("guiaMotivo", e.target.value)}
                          placeholder="Exponha os motivos que ensejam a viagem..."
                          rows={6}
                        />
                      </div>
                    </>
                  )}
                  {/* Assinatura no rodapé - sempre no final do formulário */}
                  <div className="flex flex-col gap-1.5 border-t pt-4 mt-2">
                    <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1">
                      <User className="h-3 w-3" /> Nome Completo (Rodapé de Assinatura)
                    </label>
                    <Input 
                      value={docData.assinaturaNome || ""}
                      onChange={(e) => handleFieldChange("assinaturaNome", e.target.value)}
                      placeholder="Nome completo para o rodapé"
                    />
                    <p className="text-[9px] text-muted-foreground">Aparece sob a linha de assinatura no documento impresso.</p>
                  </div>
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

            {/* Customization, Attachments & Electronic Signature Card */}
            <Card className="border-border/50 bg-card text-card-foreground shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-[#1a3a2a] dark:text-[#e2ca76] flex items-center gap-1.5">
                  <Shield className="h-4.5 w-4.5 text-[#c4a84b]" />
                  Recursos do Sistema
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Personalize o cabeçalho, adicione anexos, assine e envie via trâmite oficial.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* 1. Header Customisation */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted-foreground block">
                    Brasões Personalizados (Opcional)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">Brasão Esquerdo (PMAM)</label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-[10px] h-9 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a3a2a]/10 file:text-[#1a3a2a] dark:text-[#e2ca76] hover:file:bg-[#1a3a2a]/20"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                          });
                          handleFieldChange("imagemCabecalhoEsq", base64);
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground font-semibold">Brasão Direito (CFAP)</label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="text-[10px] h-9 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a3a2a]/10 file:text-[#1a3a2a] dark:text-[#e2ca76] hover:file:bg-[#1a3a2a]/20"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                          });
                          handleFieldChange("imagemCabecalhoDir", base64);
                        }}
                      />
                    </div>
                  </div>

                  {(docData.imagemCabecalhoEsq || docData.imagemCabecalhoDir) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 font-semibold"
                      onClick={() => {
                        const updated = { ...docData };
                        delete updated.imagemCabecalhoEsq;
                        delete updated.imagemCabecalhoDir;
                        setDocData(updated);
                        localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(updated));
                      }}
                    >
                      Restaurar Brasões Originais
                    </Button>
                  )}
                </div>

                <div className="border-t border-dashed my-3" />

                {/* 2. Document Attachments */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">
                    Anexos do Documento (Máximo 3 Imagens)
                  </span>
                  
                  {docData.anexosBase64 && docData.anexosBase64.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 border p-2 bg-muted/10 rounded-md">
                      {docData.anexosBase64.map((img, idx) => (
                        <div key={idx} className="relative group border rounded-md overflow-hidden h-16 w-full bg-white">
                          <img src={img} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl hover:bg-red-700"
                            onClick={() => {
                              const updatedAnexos = [...(docData.anexosBase64 || [])];
                              updatedAnexos.splice(idx, 1);
                              handleFieldChange("anexosBase64" as any, updatedAnexos as any);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(!docData.anexosBase64 || docData.anexosBase64.length < 3) && (
                    <div className="flex flex-col gap-1">
                      <Input
                        type="file"
                        accept="image/*"
                        id="document-attachment-file"
                        className="text-xs h-9 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#1a3a2a]/10 file:text-[#1a3a2a] hover:file:bg-[#1a3a2a]/20"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          toast.promise(
                            (async () => {
                              const base64 = await compressImage(file);
                              const currentAnexos = docData.anexosBase64 || [];
                              const updatedAnexos = [...currentAnexos, base64];
                              handleFieldChange("anexosBase64" as any, updatedAnexos as any);
                              const inputEl = document.getElementById("document-attachment-file") as HTMLInputElement;
                              if (inputEl) inputEl.value = "";
                            })(),
                            {
                              loading: "Comprimindo e preparando anexo...",
                              success: "Anexo anexado com sucesso!",
                              error: "Falha ao anexar imagem."
                            }
                          );
                        }}
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    * O Xerife Geral poderá visualizar e rolar as folhas adicionais com os anexos.
                  </p>
                </div>

                <div className="border-t border-dashed my-3" />

                {/* 3. Digital Signature */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">
                    Assinatura Eletrônica
                  </span>

                  {docData.assinaturaDigital ? (
                    <div className="rounded border border-green-200 bg-green-50/50 p-3 space-y-2">
                      <p className="text-[10px] text-green-800 font-mono font-bold uppercase tracking-wider text-center">
                        ✓ Documento Assinado Digitalmente
                      </p>
                      <div className="text-[9px] text-green-700 font-mono break-words text-left space-y-0.5">
                        {docData.assinaturaDigital.split(" | ").map((line, i) => (
                          <p key={i} className="leading-tight">{line}</p>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                        onClick={() => {
                          const updated = { ...docData };
                          delete updated.assinaturaDigital;
                          delete updated.assinadoEm;
                          setDocData(updated);
                          localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(updated));
                        }}
                      >
                        Remover Assinatura
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed text-xs font-bold text-foreground bg-white"
                      disabled={!session}
                      onClick={() => {
                        if (!session) {
                          toast.error("Você precisa estar logado para assinar.");
                          return;
                        }

                        const generateUniqueHash = () => {
                          const rawStr = `${session.id}-${session.numerica}-${session.sessionToken}-${Date.now()}`;
                          let hash = 0;
                          for (let i = 0; i < rawStr.length; i++) {
                            const char = rawStr.charCodeAt(i);
                            hash = (hash << 5) - hash + char;
                            hash |= 0;
                          }
                          return `CFAP-SIG-${Math.abs(hash).toString(36).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                        };

                        const handleSigning = (lat?: number, lon?: number) => {
                          const rgVal = profileQuery.data?.rg || "";
                          const cpfVal = profileQuery.data?.cpf || "";
                          const nomeCompleto = profileQuery.data?.nomeCompleto || session.nomeGuerra;
                          
                          const hash = generateUniqueHash();
                          const signedAt = new Date().toISOString();
                          const deviceDesc = getShortDeviceDesc(navigator.userAgent);
                          const screenRes = `${window.screen.width}x${window.screen.height}`;
                          const sessionTokenTrunc = session.sessionToken ? session.sessionToken.slice(0, 8) + "..." : "N/A";
                          
                          const locStr = (lat != null && lon != null) 
                            ? `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}` 
                            : "Não autorizada/indisponível";

                          const auditSignature = [
                            `Signatário: ${nomeCompleto.toUpperCase()}`,
                            `CPF: ${cpfVal || "Não informado"}`,
                            `CI: ${rgVal || "Não informado"}`,
                            `Sessão: ${sessionTokenTrunc}`,
                            `GPS: ${locStr}`,
                            `Dispositivo: ${deviceDesc} (${screenRes})`,
                            `Chave: ${hash}`
                          ].join(" | ");

                          const updated = { 
                            ...docData, 
                            assinaturaDigital: auditSignature,
                            assinadoEm: signedAt
                          };
                          setDocData(updated);
                          localStorage.setItem(`pmam_doc_${docType}`, JSON.stringify(updated));
                          toast.success("Documento assinado digitalmente com sucesso!");
                        };

                        if ("geolocation" in navigator) {
                          toast.info("Solicitando permissão de geolocalização para auditoria...");
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              handleSigning(position.coords.latitude, position.coords.longitude);
                            },
                            (error) => {
                              console.warn("[Signature] Geolocation failed:", error);
                              handleSigning();
                            },
                            { timeout: 5000 }
                          );
                        } else {
                          handleSigning();
                        }
                      }}
                    >
                      {!session ? "Faça login para assinar" : "Assinar Digitalmente"}
                    </Button>
                  )}
                </div>

                <div className="border-t border-dashed my-3" />

                {/* 4. Send via System */}
                <Button
                  className="w-full bg-[#1a3a2a] hover:bg-[#214936] text-white font-bold gap-2"
                  disabled={!session || !docData.assinaturaDigital || enviarParteMutation.isPending}
                  onClick={() => {
                    if (!session) return;
                    enviarParteMutation.mutate({
                      studentId: session.id,
                      sessionToken: session.sessionToken,
                      tipoDocumento: docType,
                      tipoParte: docType === "parte" ? docData.tipoParte || "dispensa" : docType,
                      remetente: docData.remetente,
                      destinatario: docData.destinatario,
                      assunto: docData.assunto,
                      anexo: docData.anexo || null,
                      localData: docData.localData,
                      conteudoJson: JSON.stringify(docData),
                      imagemCabecalhoEsq: docData.imagemCabecalhoEsq || null,
                      imagemCabecalhoDir: docData.imagemCabecalhoDir || null,
                      assinaturaDigital: docData.assinaturaDigital || null,
                    });
                  }}
                >
                  {enviarParteMutation.isPending ? "Enviando..." : "Enviar via Sistema"}
                </Button>
                {!docData.assinaturaDigital && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    * Assine digitalmente antes de enviar via sistema.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Preview Side (A4 Sheet Simulation) */}
          <div id="print-wrapper" className={`lg:col-span-7 flex flex-col gap-6 items-center overflow-auto print:overflow-visible print:block ${viewMode === "edit" ? "hidden lg:flex" : "flex"} w-full max-h-[75vh] lg:max-h-none print:max-h-none print:h-auto print:w-auto print:bg-transparent print:border-none print:p-0 bg-zinc-100/50 dark:bg-zinc-900/50 p-3 md:p-6 rounded-lg border`}>
            <div 
              id="military-document-print" 
              className="official-document-sheet flex h-[297mm] min-h-[297mm] w-[210mm] min-w-[210mm] flex-col items-center justify-start border border-gray-200 pb-[20mm] pl-[30mm] pr-[20mm] pt-[30mm] font-serif text-[12pt] leading-[1.5] shadow-2xl bg-white text-black shrink-0 [color-scheme:light] print:border-none print:bg-white print:shadow-none print:m-0 print:p-[30mm_20mm_20mm_30mm]"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                width: "210mm",
                minWidth: "210mm",
                height: "297mm",
                minHeight: "297mm",
                boxSizing: "border-box",
              }}
            >
              {/* Estilos CSS específicos de impressão injetados */}
              <style dangerouslySetInnerHTML={{__html: `
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
                @media print {
                  /* Esconde todos os elementos do corpo da página */
                  body * {
                    visibility: hidden;
                  }
                  
                  /* Torna visível apenas o documento e todos os seus filhos */
                  #military-document-print, #military-document-print * {
                    visibility: visible;
                  }
                  
                  /* Posiciona o documento no canto superior esquerdo, fora do fluxo da página (ignora grids/flex) */
                  #military-document-print {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 210mm !important;
                    height: 297mm !important;
                    min-height: 297mm !important;
                    padding: 30mm 20mm 20mm 30mm !important; /* Margens oficiais */
                    margin: 0 !important;
                    box-sizing: border-box !important;
                    border: none !important;
                    box-shadow: none !important;
                    page-break-after: always !important;
                    background: white !important;
                    color: black !important;
                  }

                  #military-document-print img {
                    image-rendering: auto !important;
                    print-color-adjust: exact !important;
                    -webkit-print-color-adjust: exact !important;
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
                  src={PMAM_HEADER_URL} 
                  alt="Brasão PMAM" 
                  className="w-[18mm] h-[18mm] object-contain mb-1" 
                  style={{ imageRendering: "-webkit-optimize-contrast" }}
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
              <div className="w-full flex-1 mt-10 text-justify flex flex-col gap-6 text-[12pt] leading-[1.5]">
                
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
              <div className="w-full flex flex-col items-center gap-10 mt-auto relative">
                <div className="w-full text-right font-medium">
                  {docData.localData || "Manaus - AM"}
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-[80mm] h-[1px] bg-black" />
                  <span className="uppercase font-bold mt-2 text-[12px] tracking-wide text-center">
                    {docData.assinaturaNome || docData.remetente || "Assinatura do Discente"}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                    Signatário
                  </span>
                  {docData.assinaturaDigital && (
                    <div className="mt-2 rounded border border-green-600/30 bg-green-50/50 px-3 py-1.5 text-center text-[10px] text-green-800 font-mono flex flex-col items-center gap-0.5 print:bg-transparent print:border-green-800">
                      <span className="font-bold tracking-wider uppercase text-green-900 print:text-green-800 flex items-center gap-0.5 mb-1">
                        🛡️ ASSINATURA ELETRÔNICA REGISTRADA
                      </span>
                      {docData.assinaturaDigital.includes(" | ") ? (
                        docData.assinaturaDigital.split(" | ").map((part: string, i: number) => (
                          <span key={i} className="block">{part}</span>
                        ))
                      ) : (
                        <span>{docData.assinaturaDigital}</span>
                      )}
                      {docData.assinadoEm && <span>Data/Hora: {new Date(docData.assinadoEm).toLocaleString("pt-BR")}</span>}
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
            </div>
            {docData.anexosBase64 && docData.anexosBase64.length > 0 && (
              <RenderDocumentAttachments 
                anexos={docData.anexosBase64} 
                remetente={docData.remetente} 
                docType={docType} 
              />
            )}
          </div>

        </div>
      </main>
    </TabsContent>

    <TabsContent value="enviados" className="flex-1 container py-6 print:hidden">
      <Card className="border-border/50 bg-white text-foreground shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1a3a2a]">Minhas Partes e Solicitações</CardTitle>
          <CardDescription>Acompanhe o status de trâmite das suas partes enviadas ao Xerife Geral.</CardDescription>
        </CardHeader>
        <CardContent>
          {minhasPartesQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground font-semibold">Carregando documentos...</div>
          ) : !minhasPartesQuery.data || minhasPartesQuery.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-semibold">Você ainda não enviou nenhum documento pelo sistema.</div>
          ) : (
            (() => {
              const ITEMS_PER_PAGE = 8;
              const totalPages = Math.ceil((minhasPartesQuery.data?.length || 0) / ITEMS_PER_PAGE);
              const paginatedDocs = (minhasPartesQuery.data || []).slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              );

              return (
                <div className="overflow-x-auto flex flex-col gap-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-black">
                        <th className="p-3 text-left font-semibold">Tipo</th>
                        <th className="p-3 text-left font-semibold">Assunto</th>
                        <th className="p-3 text-left font-semibold">Data de Envio</th>
                        <th className="p-3 text-left font-semibold">Status</th>
                        <th className="p-3 text-left font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDocs.map((doc: any) => {
                        const statusColors: Record<string, string> = {
                          enviado: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-200 dark:border-yellow-500/30",
                          aceito: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/15 dark:text-green-200 dark:border-green-500/30",
                          recusado: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30",
                          negociacao: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/30",
                        };
                        const statusLabels: Record<string, string> = {
                          enviado: "Enviado",
                          aceito: "Aceito (Aditado)",
                          recusado: "Recusado",
                          negociacao: "Em Negociação",
                        };
                        const dateFormatted = new Date(doc.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        return (
                          <tr key={doc.id} className="border-b hover:bg-muted/10 text-black">
                            <td className="p-3 font-medium uppercase">{doc.tipoDocumento === 'parte' ? `Parte (${doc.tipoParte})` : doc.tipoDocumento}</td>
                            <td className="p-3">{doc.assunto}</td>
                            <td className="p-3 text-muted-foreground">{dateFormatted}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColors[doc.status] || "bg-gray-100"}`}>
                                {statusLabels[doc.status] || doc.status}
                              </span>
                              {doc.observacaoXerife && (
                                <p className="text-[11px] text-muted-foreground mt-1 max-w-[250px] italic">
                                  Obs: {doc.observacaoXerife}
                                </p>
                              )}
                            </td>
                            <td className="p-3 flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1"
                                onClick={() => setViewDoc(doc)}
                              >
                                <Eye className="h-3.5 w-3.5" /> Ver
                              </Button>

                              {(doc.status === 'negociacao' || doc.status === 'recusado') && (
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="gap-1 bg-[#1a3a2a] text-white hover:bg-[#11271b]"
                                  onClick={() => {
                                    try {
                                      const parsed = JSON.parse(doc.conteudoJson);
                                      setDocData(parsed);
                                      setDocType(doc.tipoDocumento as any);
                                      toast.success("Documento carregado no editor! Faça os ajustes e reenvie.");
                                      const tabBtn = document.querySelector('[role="tab"][value="editor"]') as HTMLButtonElement;
                                      tabBtn?.click();
                                    } catch (e) {
                                      toast.error("Erro ao carregar documento no editor.");
                                    }
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" /> Ajustar
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Controles de Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4 px-2 select-none text-black">
                      <span className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages} ({minhasPartesQuery.data?.length} documentos)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

  <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
    <DialogContent className="max-w-[850px] max-h-[90vh] overflow-auto bg-[#d8d5cd] p-6 rounded-md">
      {viewDoc && (
        <div className="flex flex-col items-center gap-6 my-4 w-full">
          <RenderSavedDocument doc={viewDoc} />
        </div>
      )}
    </DialogContent>
  </Dialog>

  <Footer />
</div>
  );
}
