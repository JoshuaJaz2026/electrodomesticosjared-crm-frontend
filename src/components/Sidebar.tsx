import { Search, Archive, MessageSquare, Tag, Zap } from "lucide-react";
import { Chat, CustomLabel } from "../types";
import { useRef, useState } from "react";

type SidebarProps = {
  isConnected: boolean;
  filteredChats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  customLabels: CustomLabel[];
  getLabelColor: (labelName: string | null) => string;
  setIsLabelsModalOpen: (isOpen: boolean) => void;
  setIsRepliesModalOpen: (isOpen: boolean) => void;
};

export default function Sidebar({
  filteredChats, activeChat, setActiveChat, searchTerm, setSearchTerm,
  activeFilter, setActiveFilter, customLabels, getLabelColor,
  setIsLabelsModalOpen, setIsRepliesModalOpen
}: SidebarProps) {
  
  const [viewingArchived, setViewingArchived] = useState(false);

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!filterContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - filterContainerRef.current.offsetLeft);
    setScrollLeft(filterContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !filterContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - filterContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    filterContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Separar los chats archivados y activos
  const activeChatsList = filteredChats.filter(chat => chat.label !== "Archivado");
  const archivedChatsList = filteredChats.filter(chat => chat.label === "Archivado");
  const rawDisplayChats = viewingArchived ? archivedChatsList : activeChatsList;

  // 🛡️ Filtro anti-duplicados 
  const uniqueChatsMap = new Map();
  rawDisplayChats.forEach(chat => {
      if (!uniqueChatsMap.has(chat.id)) {
          uniqueChatsMap.set(chat.id, chat);
      }
  });
  const displayChats = Array.from(uniqueChatsMap.values()).slice(0, 250);

  return (
    <aside className="w-[380px] bg-[#0b0e14] flex flex-col border-r border-white/5 z-10 flex-shrink-0">
      
      <div className="p-5 border-b border-white/5 bg-[#131620]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-black text-white text-xl tracking-tight">Todos los chats</h2>
          
          <div className="flex gap-2">
            <button onClick={() => setIsLabelsModalOpen(true)} className="p-2 bg-[#1a1d2d] hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5" title="Gestor de Etiquetas">
              <Tag className="w-4 h-4" />
            </button>
            <button onClick={() => setIsRepliesModalOpen(true)} className="p-2 bg-[#1a1d2d] hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5" title="Respuestas Rápidas">
              <Zap className="w-4 h-4" />
            </button>
          </div>

        </div>
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-purple-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0e14] text-slate-200 pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all text-sm font-medium placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex p-3 gap-2 bg-[#131620] border-b border-white/5">
        <button 
            onClick={() => { setViewingArchived(false); setActiveFilter("Todas"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${!viewingArchived ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
        >
            <MessageSquare className="w-4 h-4" /> Activos
        </button>
        <button 
            onClick={() => { setViewingArchived(true); setActiveFilter("Todas"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${viewingArchived ? 'bg-slate-700/50 text-slate-300 border border-slate-500/50' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
        >
            <Archive className="w-4 h-4" /> Archivados
        </button>
      </div>

      {!viewingArchived && (
          <div className="border-b border-white/5 bg-[#0b0e14]">
            <div 
              ref={filterContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-2 p-3 overflow-x-auto scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              <button
                onClick={() => setActiveFilter("Todas")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${activeFilter === "Todas" ? "bg-purple-600/20 text-purple-400 border-purple-500/30" : "bg-[#131620] text-slate-400 border-transparent hover:border-white/10"}`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveFilter("Nuevos")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${activeFilter === "Nuevos" ? "bg-slate-500/20 text-slate-300 border-slate-500/30" : "bg-[#131620] text-slate-400 border-transparent hover:border-white/10"}`}
              >
                Nuevos
              </button>
              {customLabels.map((lbl) => (
                <button
                  key={lbl.name}
                  onClick={() => setActiveFilter(lbl.name)}
                  className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-black whitespace-nowrap transition-all flex-shrink-0 border ${activeFilter === lbl.name ? lbl.color : "bg-[#131620] text-slate-500 border-transparent hover:border-white/10"}`}
                >
                  {lbl.name}
                </button>
              ))}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-purple-900/50 hover:scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
        {displayChats.length === 0 ? (
          <div className="text-center text-slate-600 text-sm mt-10">No hay chats aquí</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {/* 🛡️ EL ESCUDO: AGREGAMOS EL INDEX MATEMÁTICO A LA LLAVE PARA CALLAR A REACT */}
            {displayChats.map((chat, index) => (
              <div
                key={`${chat.id}-${index}`} 
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${activeChat?.id === chat.id ? 'bg-[#1a1d2d] border-purple-500/30 shadow-lg shadow-purple-900/10' : 'hover:bg-[#131620] border-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-lg relative flex-shrink-0 shadow-inner">
                  {chat.name.substring(0, 1).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0b0e14] rounded-full"></span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    
                    {/* ENVOLTORIO FLEX PARA EL NOMBRE Y LA ETIQUETA DEL ASESOR */}
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h3 className={`font-bold truncate text-sm ${activeChat?.id === chat.id ? 'text-white' : 'text-slate-300'}`}>
                          {chat.name}
                        </h3>
                        
                        {/* 🌟 LA NUEVA ETIQUETA DE ASIGNACIÓN (ROUND-ROBIN) 🌟 */}
                        {chat.assignedTo && (
                           <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 whitespace-nowrap flex-shrink-0 uppercase font-black tracking-wider">
                             👤 {chat.assignedTo}
                           </span>
                        )}
                    </div>

                    {/* ETIQUETA DE ESTADO (PENDIENTE, VENTA CERRADA, ETC.) */}
                    {chat.label && chat.label !== "Archivado" && (
                      <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ml-2 flex-shrink-0 ${getLabelColor(chat.label)}`}>
                        {chat.label}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 truncate">{chat.lastMessage?.body || chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}