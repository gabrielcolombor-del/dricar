"use client";

import { useState, useEffect } from "react";

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMonth, setActiveMonth] = useState(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/erp/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setError("Erro ao carregar dados do dashboard.");
      }
    } catch (err) {
      setError("Erro de rede ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Carregando faturamento e indicadores Dricar...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center my-8">
        <p className="font-bold text-sm">{error || "Erro ao carregar os dados do painel."}</p>
        <button onClick={fetchDashboardData} className="mt-3 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { meta, cards, comparativoMensal } = data;

  // Cálculo da altura máxima para o gráfico
  const maxVal = Math.max(
    ...comparativoMensal.map(m => Math.max(m.valAnoAtual, m.valAnoAnterior)),
    2200000
  );

  // Formatação de valores resumidos para o Eixo Y (ex: R$ 2.2M, R$ 1.6M, R$ 1.1M, R$ 550k, R$ 0)
  const formatYAxis = (val) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  // Gerar coordenadas (x, y) para a curva em linha amarela (Curva Ano Atual)
  const generateCurvePoints = () => {
    const totalMonths = comparativoMensal.length;
    const chartHeight = 220; // altura interna em px
    return comparativoMensal
      .map((item, index) => {
        // Se for mês futuro (sem vendas ainda), ponto fica no 0 ou encerra a curva
        if (item.isFuturo && item.valAnoAtual === 0) return null;
        
        // Posição X proporcional
        const xPercent = ((index + 0.5) / totalMonths) * 100;
        // Posição Y (invertido, 0 no topo)
        const yPx = chartHeight - (item.valAnoAtual / maxVal) * chartHeight;
        return { index, xPercent, yPx, val: item.valAnoAtual, mes: item.mes };
      })
      .filter(Boolean);
  };

  const curvePoints = generateCurvePoints();

  return (
    <div className="space-y-8 animate-fade-in text-gray-800 font-sans pb-8">
      
      {/* SECTION 1: MÊS CORRENTE */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
          MÊS CORRENTE — {meta.mesAtualNome}/{meta.anoAtual}
        </h4>

        {/* 4 CARDS GRID (Top Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* CARD 1: Faturamento Mês Atual (Emerald Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Faturamento {meta.mesAtualAbrev}</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                  ↗
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                R$ {cards.faturamentoMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              {cards.percentualDoTotalAno.toFixed(1)}% do total {meta.anoAtual}
            </p>
          </div>

          {/* CARD 2: Carros Vendidos Mês (Blue Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-blue-500">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Carros Vendidos {meta.mesAtualAbrev}</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  📄
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                {cards.carrosVendidosMes}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              Ticket médio: R$ {cards.ticketMedioMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* CARD 3: Faturamento Ano Atual (Slate/Navy Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-slate-700">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Faturamento {meta.anoAtual}</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                  ↗
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                R$ {cards.faturamentoAnoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
              ↑ {Math.abs(cards.comparativoYoY).toFixed(1)}% vs {meta.anoAnterior} — mesmo período (Jan-{meta.mesAtualAbrev})
            </p>
          </div>

          {/* CARD 4: Faturamento Ano Anterior (Amber Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-amber-400">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Faturamento Ano Anterior</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                  📊
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                R$ {cards.faturamentoAnoAnteriorMesmoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              {meta.anoAnterior} — mesmo período (Jan-{meta.mesAtualAbrev})
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 2: DETALHES — FATURAMENTO DRICAR */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
          DETALHES — FATURAMENTO DRICAR
        </h4>

        {/* 2 CARDS GRID (Middle Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* CARD 5: Carros Vendidos Ano (Blue Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-blue-500">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Carros Vendidos Ano</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  📄
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                {cards.carrosVendidosAno}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              Ticket médio: R$ {cards.ticketMedioAno.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* CARD 6: Ticket Médio Geral (Emerald Border) */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow transition-all relative overflow-hidden flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-gray-500">Ticket Médio Geral</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                  👥
                </div>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                R$ {cards.ticketMedioGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-3">
              Média de valor por veículo vendido
            </p>
          </div>

        </div>
      </div>

      {/* SECTION 3: GRÁFICO DE FATURAMENTO MENSAL (2026 vs 2025) */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Header do Gráfico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Faturamento Mensal — {meta.anoAtual} vs {meta.anoAnterior}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Clique em uma barra para ver detalhes por mês e faturamento acumulado
            </p>
          </div>

          {/* Legenda (Top Right) */}
          <div className="flex items-center gap-5 text-xs font-semibold text-gray-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#1E293B] block"></span>
              <span>{meta.anoAtual}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#93C5FD] block"></span>
              <span>{meta.anoAnterior}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#EAB308] block"></span>
              <span>Curva {meta.anoAtual}</span>
            </div>
          </div>
        </div>

        {/* ÁREA DO GRÁFICO (Canvas / Bars & SVG Line) */}
        <div className="relative pt-6 pb-2">
          
          {/* Linhas de Grade Horizontais (Eixo Y) */}
          <div className="absolute inset-x-12 top-6 bottom-8 flex flex-col justify-between pointer-events-none z-0">
            {[2200000, 1650000, 1100000, 550000, 0].map((level) => (
              <div key={level} className="flex items-center w-full">
                <span className="w-12 text-[10px] text-gray-400 font-mono pr-2 text-right shrink-0">
                  {formatYAxis(level)}
                </span>
                <div className="w-full border-b border-gray-100 border-dashed"></div>
              </div>
            ))}
          </div>

          {/* Container das Colunas dos Meses */}
          <div className="relative pl-14 pr-2 h-[220px] flex items-end justify-between z-10">
            
            {/* SVG Curva Amarela em Camada por Cima das Barras */}
            <svg className="absolute left-14 right-2 top-0 bottom-0 w-[calc(100%-4rem)] h-full overflow-visible pointer-events-none z-20">
              {/* Linha Amarela Contínua ligando os pontos */}
              {curvePoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={curvePoints
                    .map((p) => `${(p.index + 0.5) * (100 / 12)}%,${p.yPx}`)
                    .join(" ")}
                />
              )}

              {/* Pontos Círculos Amarelos sobre a linha */}
              {curvePoints.map((p) => (
                <circle
                  key={p.index}
                  cx={`${(p.index + 0.5) * (100 / 12)}%`}
                  cy={p.yPx}
                  r="4"
                  className="fill-[#EAB308] stroke-white stroke-2"
                />
              ))}
            </svg>

            {/* Renderização das 12 Colunas de Barras */}
            {comparativoMensal.map((m, idx) => {
              const heightAnoAnterior = Math.min(100, (m.valAnoAnterior / maxVal) * 100);
              const heightAnoAtual = Math.min(100, (m.valAnoAtual / maxVal) * 100);
              const isSelected = activeMonth === m.mes;

              return (
                <div
                  key={m.mes}
                  onClick={() => setActiveMonth(isSelected ? null : m.mes)}
                  className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative transition-all ${
                    isSelected ? "bg-amber-50/30 rounded-xl" : ""
                  }`}
                >
                  {/* Tooltip Interativo no Hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-30 pointer-events-none whitespace-nowrap">
                    <p className="font-bold border-b border-gray-700 pb-0.5">{m.mes}</p>
                    <p className="text-blue-300">{meta.anoAtual}: R$ {m.valAnoAtual.toLocaleString("pt-BR")}</p>
                    <p className="text-blue-100">{meta.anoAnterior}: R$ {m.valAnoAnterior.toLocaleString("pt-BR")}</p>
                  </div>

                  {/* Grupo de Barras Duplas (Ano Anterior vs Ano Atual) */}
                  <div className="flex items-end justify-center gap-1 w-full max-w-[36px] h-full">
                    {/* Barra Ano Anterior (Azul Claro) */}
                    <div
                      className="w-1/2 bg-[#93C5FD] rounded-t-xs hover:bg-blue-400 transition-all"
                      style={{ height: `${heightAnoAnterior}%` }}
                    ></div>

                    {/* Barra Ano Atual (Navy Dark) */}
                    <div
                      className="w-1/2 bg-[#1E293B] rounded-t-xs hover:bg-slate-800 transition-all"
                      style={{ height: `${heightAnoAtual}%` }}
                    ></div>
                  </div>

                  {/* Nome do Mês (Eixo X) */}
                  <span className={`text-[11px] font-semibold mt-3 transition-colors ${
                    isSelected ? "text-amber-700 font-extrabold" : "text-gray-500 group-hover:text-gray-900"
                  }`}>
                    {m.mes}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        {/* Detalhes do Mês Selecionado */}
        {activeMonth && (() => {
          const m = comparativoMensal.find(x => x.mes === activeMonth);
          if (!m) return null;
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs animate-fade-in">
              <div>
                <span className="font-bold text-slate-800 uppercase block">Detalhamento do Mês: {m.mes}</span>
                <span className="text-slate-500">Comparativo direto de vendas registradas entre {meta.anoAtual} e {meta.anoAnterior}.</span>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">{meta.anoAnterior}</span>
                  <span className="font-extrabold text-blue-600">R$ {m.valAnoAnterior.toLocaleString("pt-BR")}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">{meta.anoAtual}</span>
                  <span className="font-extrabold text-slate-900">R$ {m.valAnoAtual.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

    </div>
  );
}
