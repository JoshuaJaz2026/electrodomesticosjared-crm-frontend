import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, ShoppingBag, Clock, Tag, Calendar, Download } from "lucide-react";

type StatsData = {
  labels: { label: string; count: string }[];
  agents: { agent_name: string; count: string }[];
};

type StatsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  socket: any;
};

export default function StatsPanel({ isOpen, onClose, socket }: StatsPanelProps) {
  const [stats, setStats] = useState<StatsData>({ labels: [], agents: [] });

  useEffect(() => {
    if (!isOpen) return;
    socket.emit('get-stats');
    const handleLoadStats = (data: StatsData) => setStats(data);
    socket.on('load-stats', handleLoadStats);
    return () => { socket.off('load-stats', handleLoadStats); };
  }, [isOpen, socket]);

  if (!isOpen) return null;

  const getLabelCount = (labelName: string) => Number(stats.labels.find(l => l.label === labelName)?.count || 0);
  const ventasCerradas = getLabelCount('Venta Cerrada');
  const pendientes = getLabelCount('Pendiente');
  const atendiendo = getLabelCount('Atendiendo');
  const maxMessages = Math.max(...stats.agents.map(a => Number(a.count)), 1);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 overflow-hidden animate-in fade-in duration-300">
      
      {/* 🌟 CABECERA PROFESIONAL E INTEGRADA */}
      <header className="p-6 bg-white border-b border-zinc-200 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600"/> Rendimiento Comercial
          </h2>
          <p className="text-sm text-slate-500 mt-1">Monitorea las métricas, ventas y productividad de tu equipo.</p>
        </div>
        
        {/* Opciones Profesionales de Filtrado */}
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <Calendar className="w-4 h-4"/> Este Mes
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                <Download className="w-4 h-4"/> Exportar CSV
            </button>
        </div>
      </header>
      
      <div className="p-8 overflow-y-auto flex-1">
          {/* TARJETAS SUPERIORES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner"><ShoppingBag className="w-7 h-7"/></div>
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ventas Cerradas</p>
                      <p className="text-3xl font-black text-slate-800 leading-none">{ventasCerradas}</p>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner"><Clock className="w-7 h-7"/></div>
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pendientes</p>
                      <p className="text-3xl font-black text-slate-800 leading-none">{pendientes}</p>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><TrendingUp className="w-7 h-7"/></div>
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">En Atención</p>
                      <p className="text-3xl font-black text-slate-800 leading-none">{atendiendo}</p>
                  </div>
              </div>
          </div>

          {/* SECCIÓN DE GRÁFICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Productividad por Asesor */}
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600"/> Productividad por Asesor</h3>
                      <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Mensajes enviados</span>
                  </div>
                  <div className="flex flex-col gap-5">
                      {stats.agents.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No hay datos suficientes.</p> : null}
                      {stats.agents.map((agent, i) => (
                          <div key={i}>
                              <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                  <span>{agent.agent_name}</span>
                                  <span className="text-slate-500">{agent.count} msgs</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(Number(agent.count) / maxMessages) * 100}%` }}></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Distribución Global de Etiquetas */}
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Tag className="w-5 h-5 text-emerald-600"/> Distribución de Clientes</h3>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Por Etiqueta</span>
                  </div>
                  <div className="flex flex-col gap-5">
                      {stats.labels.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No hay etiquetas asignadas.</p> : null}
                      {stats.labels.map((label, i) => {
                          const maxLabels = Math.max(...stats.labels.map(l => Number(l.count)), 1);
                          return (
                              <div key={i}>
                                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                      <span>{label.label}</span>
                                      <span className="text-slate-500">{label.count} clientes</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(Number(label.count) / maxLabels) * 100}%` }}></div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}