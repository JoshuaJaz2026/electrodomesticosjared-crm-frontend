import { neon } from '@neondatabase/serverless';
import { Package, CheckCircle2, ShoppingCart, CreditCard } from 'lucide-react';

// Forzamos a que esta página sea dinámica y no se guarde en caché estático
export const dynamic = 'force-dynamic';

export default async function CotizacionLandingPage(props: { params: Promise<{ id: string }> }) {
  // 1. Desempaquetamos la promesa de 'params' (Nuevo estándar de Next.js 15)
  const params = await props.params;
  const quoteId = params.id;

  // 2. Conexión segura a tu BD de Neon
  const sql = neon(process.env.DATABASE_URL!);

  // 3. Buscamos la cotización específica
  let quote;
  try {
    const result = await sql`SELECT * FROM quotes WHERE quote_id = ${quoteId}`;
    quote = result[0];
  } catch (error) {
    console.error("Error buscando cotización:", error);
  }

  // 4. Pantalla de Error si el enlace no existe
  if (!quote) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center p-6 text-center">
        <Package className="w-16 h-16 text-slate-700 mb-4" />
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Cotización no encontrada</h1>
        <p className="text-slate-400">El enlace parece ser incorrecto o la cotización ya expiró.</p>
      </div>
    );
  }

  // 5. Parsear los productos (items) guardados en JSON
  const items = typeof quote.items === 'string' ? JSON.parse(quote.items) : quote.items;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 py-10 px-4 sm:px-6 flex justify-center font-sans">
      <div className="max-w-2xl w-full">
        
        {/* Cabecera de la Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-500 mb-4 border border-purple-500/30 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Electrodomésticos Jared</h1>
          <p className="text-slate-400 mt-1">Cotización Oficial • {quote.quote_id}</p>
        </div>

        {/* Tarjeta Principal del Recibo */}
        <div className="bg-[#131620] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Estado</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {quote.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">Resumen de tu pedido</h2>
          </div>

          <div className="p-6 sm:p-8">
            <div className="space-y-4">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0b0e14] border border-white/5">
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base truncate">{item.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white text-lg">S/ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total a Pagar */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total a pagar</p>
                  <p className="text-xs text-slate-500">Impuestos incluidos</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    S/ {Number(quote.total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Botones de Acción */}
        <div className="mt-8 gap-4 flex flex-col sm:flex-row">
          <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" /> Confirmar y Pagar
          </button>
          <button className="flex-1 bg-[#131620] hover:bg-white/5 text-slate-300 border border-white/10 font-bold py-4 rounded-2xl transition-all">
            Descargar PDF
          </button>
        </div>

      </div>
    </div>
  );
}