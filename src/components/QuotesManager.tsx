import { useState, useEffect } from "react";
import { FileText, Search, DollarSign, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function QuotesManager({ socket }: { socket: any }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    socket.emit("get-all-quotes");
    socket.on("load-all-quotes", (data: any[]) => setQuotes(data));
    return () => { socket.off("load-all-quotes"); };
  }, [socket]);

  // Cálculos Financieros
  const totalRevenue = quotes.filter(q => q.status === "Pagado").reduce((sum, q) => sum + Number(q.total), 0);
  const pendingRevenue = quotes.filter(q => q.status === "Pendiente").reduce((sum, q) => sum + Number(q.total), 0);

  const filteredQuotes = quotes.filter(q => 
    (q.quote_id || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (q.contact_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (quoteId: string, newStatus: string) => {
    socket.emit("update-quote-status", { quoteId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    if (status === "Pagado") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "Rechazado") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f111a] animate-in fade-in duration-300">
      <header className="p-6 bg-[#131620] border-b border-white/5 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-500" /> Finanzas y Cotizaciones
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gestión de presupuestos y estado de cobros.</p>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Tarjetas Financieras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131620] p-6 rounded-2xl border border-white/5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500"><DollarSign /></div>
              <div><p className="text-slate-400 text-sm font-bold uppercase">Ingresos (Pagados)</p><p className="text-2xl font-black text-white">S/ {totalRevenue.toFixed(2)}</p></div>
            </div>
            <div className="bg-[#131620] p-6 rounded-2xl border border-white/5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500"><Clock /></div>
              <div><p className="text-slate-400 text-sm font-bold uppercase">En Negociación</p><p className="text-2xl font-black text-white">S/ {pendingRevenue.toFixed(2)}</p></div>
            </div>
            <div className="bg-[#131620] p-6 rounded-2xl border border-white/5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500"><FileText /></div>
              <div><p className="text-slate-400 text-sm font-bold uppercase">Cotizaciones Totales</p><p className="text-2xl font-black text-white">{quotes.length}</p></div>
            </div>
          </div>

          {/* Tabla de Cotizaciones */}
          <div className="bg-[#131620] border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 bg-[#0b0e14] flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-500" />
              <input type="text" placeholder="Buscar por ID de Cotización o Cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600 font-medium"/>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1d2d]/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                    <th className="p-4 font-bold">ID Cotización</th>
                    <th className="p-4 font-bold">Fecha</th>
                    <th className="p-4 font-bold">Cliente</th>
                    <th className="p-4 font-bold">Monto Total</th>
                    <th className="p-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredQuotes.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay cotizaciones registradas.</td></tr>
                  ) : (
                    filteredQuotes.map((q, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-400">{q.quote_id}</td>
                        <td className="p-4 text-slate-400 text-xs">{q.date}</td>
                        <td className="p-4 font-medium text-white">{q.contact_name || q.contact_id.split('@')[0]}</td>
                        <td className="p-4 font-black text-emerald-400">S/ {Number(q.total).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <select 
                            value={q.status} 
                            onChange={(e) => handleStatusChange(q.quote_id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold outline-none border cursor-pointer ${getStatusColor(q.status)}`}
                          >
                            <option value="Pendiente" className="bg-[#131620] text-white">⏳ Pendiente</option>
                            <option value="Pagado" className="bg-[#131620] text-white">✅ Pagado</option>
                            <option value="Rechazado" className="bg-[#131620] text-white">❌ Rechazado</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}