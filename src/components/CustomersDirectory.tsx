import { useState, useEffect } from "react";
import { Users, Search, Download, Phone } from "lucide-react";

export default function CustomersDirectory({ socket }: { socket: any }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Apenas carga la pantalla, le pedimos toda la base de datos al servidor
    socket.emit("get-all-contacts");
    
    socket.on("load-all-contacts", (data: any[]) => {
      setContacts(data);
    });

    return () => {
      socket.off("load-all-contacts");
    };
  }, [socket]);

  // Buscador en tiempo real
  const filteredContacts = contacts.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.id || "").includes(searchTerm) ||
    (c.document_id || "").includes(searchTerm)
  );

  // 🌟 MAGIA: Convertir los datos a CSV y descargarlos
  const exportToCSV = () => {
    if (contacts.length === 0) return alert("No hay datos para exportar.");

    // 1. Definir las cabeceras de Excel
    const headers = ["Numero_WhatsApp", "Nombre_Perfil", "Nombre_Real", "DNI_RUC", "Tipo_Cliente", "Etiqueta", "Ultima_Interaccion"];
    
    // 2. Mapear los datos
    const csvRows = contacts.map(c => {
      const phone = c.id ? c.id.split('@')[0] : '';
      // Envolvemos en comillas por si hay comas en los nombres
      return [
        phone,
        `"${c.name || ''}"`,
        `"${c.full_name || ''}"`,
        c.document_id || '',
        c.customer_type || '',
        c.label || 'Sin etiqueta',
        `"${c.last_seen || ''}"`
      ].join(",");
    });

    // 3. Unir todo con saltos de línea
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Crear el archivo descargable
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Jared_CRM_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f111a] animate-in fade-in duration-300">
      {/* Cabecera */}
      <header className="p-6 bg-[#131620] border-b border-white/5 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" /> Directorio de Clientes
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Base de datos completa: {contacts.length} contactos registrados.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto bg-[#131620] border border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Barra de Búsqueda */}
          <div className="p-4 border-b border-white/5 bg-[#0b0e14] flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, número de WhatsApp o DNI..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-slate-600 font-medium"
            />
          </div>

          {/* Tabla de Clientes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1d2d]/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="p-4 font-bold">Cliente / WhatsApp</th>
                  <th className="p-4 font-bold">Nombre Completo</th>
                  <th className="p-4 font-bold">DNI / RUC</th>
                  <th className="p-4 font-bold">Tipo</th>
                  <th className="p-4 font-bold">Última Interacción</th>
                  <th className="p-4 font-bold">Estado Actual</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron clientes en la base de datos.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            {(contact.name || "?").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{contact.name || "Desconocido"}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {contact.id.split('@')[0]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{contact.full_name || "-"}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{contact.document_id || "-"}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300 font-bold">
                          {contact.customer_type || "No definido"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs">{contact.last_seen || "-"}</td>
                      <td className="p-4">
                        {contact.label ? (
                           <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-500/30 text-slate-300">
                             {contact.label}
                           </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-bold uppercase">Sin etiqueta</span>
                        )}
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
  );
}