import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RelatorioMovimentos, FiltroRelatorio } from './hooks.ts';

const ROTULO_PERIODO = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal' } as const;
const ROTULO_MOV = {
  ENTRADA: 'Entradas', SAIDA: 'Saídas',
  AJUSTE_ENTRADA: 'Ajustes de entrada', AJUSTE_SAIDA: 'Ajustes de saída',
} as const;

// Logótipo do sistema (engrenagem verde + chave), igual ao da UI, em SVG.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<g fill="#1f9d5a">
<rect x="28.5" y="2" width="7" height="12" rx="2.5"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(45 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(90 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(135 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(180 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(225 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(270 32 32)"/>
<rect x="28.5" y="2" width="7" height="12" rx="2.5" transform="rotate(315 32 32)"/>
<circle cx="32" cy="32" r="18"/>
</g>
<circle cx="32" cy="32" r="10" fill="#0e2a1c" opacity="0.25"/>
<line x1="25" y1="39" x2="39" y2="25" stroke="#0b1220" stroke-width="5" stroke-linecap="round"/>
<circle cx="39" cy="25" r="5" fill="none" stroke="#0b1220" stroke-width="4"/>
</svg>`;

// Converte o SVG do logo em PNG (data-URI) para o jsPDF conseguir inserir.
function svgParaPng(svg: string, tamanho: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = tamanho; canvas.height = tamanho;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas indisponível')); return; }
      ctx.drawImage(img, 0, 0, tamanho, tamanho);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('falha ao carregar logo')); };
    img.src = url;
  });
}

function fmtData(iso: string) { return new Date(iso).toLocaleDateString('pt-PT'); }
function ultimaY(doc: jsPDF, fallback: number) {
  return (doc as any).lastAutoTable?.finalY ?? fallback;
}

const VERDE: [number, number, number] = [31, 157, 90];
const CINZENTO: [number, number, number] = [107, 119, 133];

export async function exportarRelatorioPdf(r: RelatorioMovimentos, f: FiltroRelatorio) {
  const doc = new jsPDF();
  const logo = await svgParaPng(LOGO_SVG, 256);

  // Cabeçalho com LOGO do sistema
  doc.addImage(logo, 'PNG', 14, 10, 15, 15);
  doc.setFontSize(16); doc.setTextColor(21, 32, 43);
  doc.text('OficinaGest', 33, 18);
  doc.setFontSize(11);
  doc.text('Relatório de Movimentações', 33, 24);
  doc.setFontSize(9); doc.setTextColor(...CINZENTO);
  doc.text(`Período: ${ROTULO_PERIODO[f.periodo]}   |   De ${fmtData(r.desde)} a ${fmtData(r.ate)}`, 14, 32);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, 14, 37);
  doc.setTextColor(21, 32, 43);

  const margem = { bottom: 20 }; // reserva espaço para o rodapé paginado

  // 1) Totais por tipo de movimento
  autoTable(doc, {
    startY: 43,
    margin: margem,
    head: [['Tipo de movimento', 'Total']],
    body: r.porTipo.map((t) => [ROTULO_MOV[t.tipo as keyof typeof ROTULO_MOV] ?? t.tipo, String(t.total)]),
    theme: 'striped',
    headStyles: { fillColor: VERDE },
  });

  // 2) Movimentos por período
  autoTable(doc, {
    startY: ultimaY(doc, 70) + 8,
    margin: margem,
    head: [['Período', 'Entradas', 'Saídas', 'Ajustes (+)', 'Ajustes (−)', 'Total']],
    body: r.porPeriodo.map((p) => [
      p.periodo, String(p.entradas), String(p.saidas),
      String(p.ajustesEntrada), String(p.ajustesSaida), String(p.total),
    ]),
    theme: 'striped',
    headStyles: { fillColor: VERDE },
  });

  // 3) Top 10 materiais
  autoTable(doc, {
    startY: ultimaY(doc, 110) + 8,
    margin: margem,
    head: [['Código', 'Material', 'Movimentos', 'Quantidade total']],
    body: r.topMateriais.map((m) => [m.codigo, m.nome, String(m.movimentos), String(m.quantidadeTotal)]),
    theme: 'striped',
    headStyles: { fillColor: VERDE },
  });

  // Rodapé com PAGINAÇÃO em todas as páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    const altura = doc.internal.pageSize.getHeight();
    doc.setFontSize(9); doc.setTextColor(...CINZENTO);
    doc.text('OficinaGest — Sistema de Gestão de Inventário para Oficinas', 14, altura - 8);
    doc.text(`Página ${i} de ${totalPaginas}`, 196, altura - 8, { align: 'right' });
  }

  doc.save(`relatorio-movimentacoes-${f.periodo}.pdf`);
}