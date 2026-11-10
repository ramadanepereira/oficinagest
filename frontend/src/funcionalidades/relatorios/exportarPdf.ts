import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RelatorioMovimentos, FiltroRelatorio } from './hooks.ts';

const ROTULO_PERIODO = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal' } as const;
const ROTULO_MOV = {
  ENTRADA: 'Entradas', SAIDA: 'Saídas',
  AJUSTE_ENTRADA: 'Ajustes de entrada', AJUSTE_SAIDA: 'Ajustes de saída',
} as const;

function fmtData(iso: string) { return new Date(iso).toLocaleDateString('pt-PT'); }
function ultimaY(doc: jsPDF, fallback: number) {
  return (doc as any).lastAutoTable?.finalY ?? fallback;
}

// Gera e descarrega um PDF com o relatório completo de movimentações.
export function exportarRelatorioPdf(r: RelatorioMovimentos, f: FiltroRelatorio) {
  const doc = new jsPDF();
  const verde: [number, number, number] = [31, 157, 90];

  // Cabeçalho
  doc.setFontSize(16);
  doc.setTextColor(21, 32, 43);
  doc.text('OficinaGest — Relatório de Movimentações', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(107, 119, 133);
  doc.text(`Período: ${ROTULO_PERIODO[f.periodo]}   |   De ${fmtData(r.desde)} a ${fmtData(r.ate)}`, 14, 25);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-PT')}`, 14, 30);
  doc.setTextColor(21, 32, 43);

  // 1) Totais por tipo de movimento
  autoTable(doc, {
    startY: 36,
    head: [['Tipo de movimento', 'Total']],
    body: r.porTipo.map((t) => [ROTULO_MOV[t.tipo as keyof typeof ROTULO_MOV] ?? t.tipo, String(t.total)]),
    theme: 'striped',
    headStyles: { fillColor: verde },
  });

  // 2) Movimentos por período
  autoTable(doc, {
    startY: ultimaY(doc, 60) + 8,
    head: [['Período', 'Entradas', 'Saídas', 'Ajustes (+)', 'Ajustes (−)', 'Total']],
    body: r.porPeriodo.map((p) => [
      p.periodo, String(p.entradas), String(p.saidas),
      String(p.ajustesEntrada), String(p.ajustesSaida), String(p.total),
    ]),
    theme: 'striped',
    headStyles: { fillColor: verde },
  });

  // 3) Top 10 materiais
  autoTable(doc, {
    startY: ultimaY(doc, 100) + 8,
    head: [['Código', 'Material', 'Movimentos', 'Quantidade total']],
    body: r.topMateriais.map((m) => [m.codigo, m.nome, String(m.movimentos), String(m.quantidadeTotal)]),
    theme: 'striped',
    headStyles: { fillColor: verde },
  });

  doc.save(`relatorio-movimentacoes-${f.periodo}.pdf`);
}