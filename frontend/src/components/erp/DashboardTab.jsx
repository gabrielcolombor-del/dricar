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

  const { meta, cards, comparativoMensal, vendasPorCategoria } = data;

  // Cálculo da altura máxima dinâmica para o gráfico
  const maxVal = Math.max(
    ...comparativoMensal.map(m => Math.max(m.valAnoAtual, m.valAnoAnterior)),
    1800000
  );

  // Formatação de valores resumidos para o Eixo Y
  const formatYAxis = (val) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  // Pontos da linha amarela exclusivamente sobre o ÁPICE (topo) da coluna de 2026 (apenas meses com vendas > 0)
  const curvePoints = comparativoMensal
    .map((item, index) => {
      if (item.valAnoAtual <= 0) return null; // Não desenha pontos para meses futuros sem vendas
      return {
        index,
        val: item.valAnoAtual,
        mes: item.mes
      };
    })
    .filter(Boolean);

  // Cores por categoria para o novo gráfico
  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Hatch": return "bg-blue-500 text-blue-600 border-blue-200";
      case "Sedan": return "bg-emerald-500 text-emerald-600 border-emerald-200";
      case "SUV": return "bg-purple-500 text-purple-600 border-purple-200";
      case "Picape": return "bg-amber-500 text-amber-600 border-amber-200";
      case "Moto": return "bg-rose-500 text-rose-600 border-rose-200";
      case "Utilitário": return "bg-indigo-500 text-indigo-600 border-indigo-200";
      default: return "bg-slate-500 text-slate-600 border-slate-200";
    }
  };

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
              {meta.anoAnterior} — Total do Ano Inteiro (Jan-Dez)
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

      {/* SECTION 3: GRÁFICO 1 - FATURAMENTO MENSAL (2026 vs 2025) */}
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
        <div className="relative pt-6 pb-6">
          
          {/* Linhas de Grade Horizontais (Eixo Y) */}
          <div className="absolute inset-x-12 top-6 bottom-12 flex flex-col justify-between pointer-events-none z-0">
            {[maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0].map((level) => (
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
            
            {/* SVG Curva Amarela Posicionada EXATAMENTE sobre o ÁPICE (topo) da Coluna Escura de 2026 */}
            <svg 
              className="absolute left-14 right-2 top-0 bottom-0 w-[calc(100%-4rem)] h-full overflow-visible pointer-events-none z-20"
              viewBox="0 0 1200 220"
              preserveAspectRatio="none"
            >
              {/* Linha Amarela Contínua ligando os ápices das barras de 2026 */}
              {curvePoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#EAB308"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={curvePoints
                    .map((p) => {
                      // O centro da barra de 2026 fica deslocado +10px à direita do centro da coluna
                      const x = (p.index + 0.5) * (1200 / 12) + 10;
                      const y = 220 - (p.val / maxVal) * 220;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />
              )}

              {/* Pontos Círculos Amarelos EXATAMENTE no topo da barra de 2026 */}
              {curvePoints.map((p) => {
                const x = (p.index + 0.5) * (1200 / 12) + 10;
                const y = 220 - (p.val / maxVal) * 220;
                return (
                  <circle
                    key={p.index}
                    cx={x}
                    cy={y}
                    r="4.5"
                    className="fill-[#EAB308] stroke-white stroke-2"
                  />
                );
              })}
            </svg>

            {/* Renderização das 12 Colunas de Barras */}
            {comparativoMensal.map((m) => {
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
                  <div className="flex items-end justify-center gap-1.5 w-full max-w-[40px] h-full">
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

      {/* SECTION 4: GRÁFICO DE BARRAS LATERAIS (HORIZONTAIS) - VENDAS POR CATEGORIA DE VEÍCULO */}
      {vendasPorCategoria && vendasPorCategoria.length > 0 && (() => {
        const maxCatCount = Math.max(...vendasPorCategoria.map(c => c.quantidade), 1);

        const getCategoryGradient = (cat) => {
          switch (cat) {
            case "Hatch": return "from-blue-600 to-indigo-500 text-blue-700 bg-blue-50 border-blue-200";
            case "Sedan": return "from-emerald-600 to-teal-500 text-emerald-700 bg-emerald-50 border-emerald-200";
            case "SUV": return "from-purple-600 to-violet-500 text-purple-700 bg-purple-50 border-purple-200";
            case "Picape": return "from-amber-500 to-orange-500 text-amber-700 bg-amber-50 border-amber-200";
            case "Moto": return "from-rose-500 to-red-500 text-rose-700 bg-rose-50 border-rose-200";
            case "Utilitário": return "from-indigo-600 to-cyan-600 text-indigo-700 bg-indigo-50 border-indigo-200";
            default: return "from-slate-600 to-gray-500 text-slate-700 bg-slate-50 border-slate-200";
          }
        };

        const getCategoryIcon = (cat) => {
          switch (cat) {
            case "Hatch": return "🚗";
            case "Sedan": return "🚘";
            case "SUV": return "🚙";
            case "Picape": return "🛻";
            case "Moto": return "🏍️";
            case "Utilitário": return "🚐";
            default: return "🏎️";
          }
        };

        return (
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">
                  Ranking de Vendas por Categoria de Veículo (Gráfico de Barras Horizontais)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Relação de qual tipo de carro vende mais durante o ano (Hatch, Sedan, SUV, Picape...)
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
                Total: {cards.carrosVendidosAno || vendasPorCategoria.reduce((a, b) => a + b.quantidade, 0)} veículos vendidos
              </span>
            </div>

            {/* Linhas de Grade de Apoio para Eixo X */}
            <div className="space-y-4 pt-2">
              <div className="hidden sm:flex justify-between pl-36 pr-44 text-[10px] font-mono text-gray-400 border-b border-gray-100 pb-1">
                <span>0</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% (Líder)</span>
              </div>

              {/* Lista de Barras Horizontais por Categoria */}
              <div className="space-y-3.5">
                {vendasPorCategoria.map((catItem, idx) => {
                  const barWidthPercent = (catItem.quantidade / maxCatCount) * 100;
                  const styleClasses = getCategoryGradient(catItem.categoria);
                  const icon = getCategoryIcon(catItem.categoria);

                  return (
                    <div key={catItem.categoria} className="flex flex-col sm:flex-row sm:items-center gap-2 group">
                      
                      {/* Rótulo da Categoria (Lado Esquerdo - Y Axis) */}
                      <div className="w-full sm:w-36 flex items-center justify-between sm:justify-start gap-2 shrink-0">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${styleClasses}`}>
                          <span>{icon}</span>
                          <span>{catItem.categoria}</span>
                        </span>
                        <span className="sm:hidden font-mono text-xs font-bold text-gray-600">
                          {catItem.quantidade} un. ({catItem.percentual.toFixed(1)}%)
                        </span>
                      </div>

                      {/* Trilha e Barra Horizontal Proporcional */}
                      <div className="flex-1 bg-slate-100 rounded-xl h-8 p-1 relative overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-lg bg-gradient-to-r ${styleClasses.split(' ')[0]} ${styleClasses.split(' ')[1]} transition-all duration-700 ease-out shadow-sm flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(4, barWidthPercent)}%` }}
                        >
                          {barWidthPercent > 18 && (
                            <span className="text-[10px] font-extrabold text-white font-mono tracking-tight drop-shadow-xs">
                              {catItem.quantidade} un.
                            </span>
                          )}
                        </div>

                        {barWidthPercent <= 18 && (
                          <span className="text-[10px] font-extrabold text-slate-700 font-mono pl-2">
                            {catItem.quantidade} un.
                          </span>
                        )}
                      </div>

                      {/* Coluna de Faturamento e Porcentagem (Lado Direito) */}
                      <div className="w-full sm:w-44 flex items-center justify-between sm:justify-end gap-3 shrink-0 text-right">
                        <div>
                          <span className="text-xs font-extrabold text-gray-900 block">
                            R$ {catItem.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold font-mono">
                            {catItem.percentual.toFixed(1)}% das vendas
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
