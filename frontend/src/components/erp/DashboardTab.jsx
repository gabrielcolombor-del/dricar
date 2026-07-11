"use client";

import { useState, useEffect } from "react";

export default function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        <span className="ml-3 text-gray-500 font-semibold">Carregando indicadores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
        <p className="font-bold">{error}</p>
        <button onClick={fetchDashboardData} className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { kpis, charts, alertas } = data || {
    kpis: { faturamentoMesAtual: 0, comparativoYoY: 0, ticketMedio: 0, lucroLiquidoReal: 0, giroEstoque: 0 },
    charts: { custosFixos: 0, custosVariaveis: 0 },
    alertas: { maisDeTrintaDias: [], pendenciaDocumentacao: [] }
  };

  const totalCustos = charts.custosFixos + charts.custosVariaveis;
  const percFixos = totalCustos > 0 ? (charts.custosFixos / totalCustos) * 100 : 0;
  const percVariaveis = totalCustos > 0 ? (charts.custosVariaveis / totalCustos) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in text-gray-800">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Faturamento */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Faturamento Mensal</span>
          <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
            R$ {kpis.faturamentoMesAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-3 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              kpis.comparativoYoY >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {kpis.comparativoYoY >= 0 ? "▲" : "▼"} {Math.abs(kpis.comparativoYoY).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400 font-medium">YoY vs ano anterior</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket Médio</span>
          <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
            R$ {kpis.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-gray-400 mt-4">Média geral por carro vendido</p>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro Líquido Real</span>
          <h3 className={`text-2xl font-extrabold mt-2 ${kpis.lucroLiquidoReal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            R$ {kpis.lucroLiquidoReal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-gray-400 mt-4">Lucros vendas - despesas (Gerais & Carro)</p>
        </div>

        {/* Giro de Estoque */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Giro de Estoque</span>
          <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
            {kpis.giroEstoque} {kpis.giroEstoque === 1 ? "dia" : "dias"}
          </h3>
          <p className="text-[10px] text-gray-400 mt-4">Tempo médio de pátio por veículo</p>
        </div>
      </div>

      {/* Gráficos e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Custos */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Custos Fixos vs Custos Variáveis</h4>
            <p className="text-xs text-gray-400 mb-6">Detalhamento dos custos gerais de operação da empresa (Exclui valor de compra de carros)</p>
          </div>

          <div className="space-y-6">
            {/* Custos Fixos Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Custos Fixos (Aluguel, Folha de Pagamento, etc.)</span>
                <span>R$ {charts.custosFixos.toLocaleString("pt-BR")} ({percFixos.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percFixos || 5}%` }}
                ></div>
              </div>
            </div>

            {/* Custos Variáveis Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Custos Variáveis (Marketing, Impostos, etc.)</span>
                <span>R$ {charts.custosVariaveis.toLocaleString("pt-BR")} ({percVariaveis.toFixed(0)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-coral-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percVariaveis || 5}%`, backgroundColor: '#ff7a59' }}
                ></div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs font-bold text-gray-500">
              <span>Custo Total Operacional:</span>
              <span className="text-sm text-gray-800">R$ {totalCustos.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            ⚠️ Painel de Alertas
          </h4>

          <div className="flex-grow space-y-4 overflow-y-auto max-h-[320px] pr-2">
            {/* >30 Dias em Estoque */}
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                Veículos Parados &gt; 30 dias ({alertas.maisDeTrintaDias.length})
              </span>
              {alertas.maisDeTrintaDias.length === 0 ? (
                <p className="text-xs text-green-600 bg-green-50 p-2.5 rounded-lg font-medium">Estoque saudável! Nenhum veículo parado há mais de 30 dias.</p>
              ) : (
                <div className="space-y-2">
                  {alertas.maisDeTrintaDias.map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-amber-900 block">{v.marca} {v.modelo}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">{v.placa}</span>
                      </div>
                      <span className="font-extrabold text-amber-800 shrink-0">{v.diasEstoque} dias</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documentação Pendente */}
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                Pendência de Transferência ({alertas.pendenciaDocumentacao.length})
              </span>
              {alertas.pendenciaDocumentacao.length === 0 ? (
                <p className="text-xs text-green-600 bg-green-50 p-2.5 rounded-lg font-medium">Todas as documentações regularizadas.</p>
              ) : (
                <div className="space-y-2">
                  {alertas.pendenciaDocumentacao.map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-red-50/70 border border-red-100 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-red-900 block">{v.marca} {v.modelo}</span>
                        <span className="text-[10px] text-red-700 bg-red-100/50 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">{v.placa}</span>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">Pendente</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
