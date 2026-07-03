import { useState } from "react";
import { Chat, CustomLabel } from "../types";
import { MessageSquare, UserCircle2 } from "lucide-react";

type KanbanBoardProps = {
  chats: Chat[];
  customLabels: CustomLabel[];
  getLabelColor: (labelName: string | null) => string;
  handleLabelChange: (chatId: string, newLabel: string) => void;
};

export default function KanbanBoard({ chats, customLabels, getLabelColor, handleLabelChange }: KanbanBoardProps) {
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);

  // 🌟 CAMBIO CLAVE: Eliminamos la columna "Nuevos Prospectos / Sin etiqueta"
  // Ahora el embudo construirá sus columnas estricta y únicamente basadas en tus etiquetas personalizadas.
  const columns = customLabels.map(lbl => ({ 
    id: lbl.name, 
    name: lbl.name, 
    value: lbl.name, 
    color: lbl.color 
  }));

  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChatId(chatId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetLabel: string) => {
    e.preventDefault();
    if (draggedChatId) {
      handleLabelChange(draggedChatId, targetLabel);
      setDraggedChatId(null);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0e14] relative min-w-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        .kanban-scroll::-webkit-scrollbar { height: 14px; }
        .kanban-scroll::-webkit-scrollbar-track { background: #0b0e14; border-top: 1px solid rgba(255,255,255,0.05); }
        .kanban-scroll::-webkit-scrollbar-thumb { background: #9333ea; border-radius: 7px; border: 3px solid #0b0e14; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: #a855f7; }
      `}} />

      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden kanban-scroll">
        
        <div className="flex gap-6 p-6 h-full w-max items-start">
          
          {columns.map((col) => {
            // 🌟 FILTRAMOS LOS CHATS: Solo obtenemos los que coincidan exactamente con la etiqueta de esta columna
            const columnChats = chats.filter(chat => chat.label === col.id);

            return (
              <div 
                key={col.id} 
                className="w-80 flex flex-col bg-[#131620] border border-white/5 rounded-2xl flex-shrink-0 shadow-sm h-fit max-h-[calc(100vh-120px)]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.value)}
              >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0b0e14] rounded-t-2xl flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${col.color}`}>
                    {col.name}
                  </span>
                  <span className="bg-[#131620] text-slate-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-white/5 shadow-inner">
                      {columnChats.length}
                  </span>
                </div>

                <div className="overflow-y-auto p-4 flex flex-col gap-3">
                  {columnChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center opacity-30 text-slate-500 min-h-[120px]">
                      <p className="text-xs font-medium border border-dashed border-slate-600 px-6 py-8 rounded-xl text-center w-full">
                          Arrastra un cliente aquí
                      </p>
                    </div>
                  ) : (
                    columnChats.map(chat => (
                      <div 
                        key={chat.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, chat.id)}
                        className="bg-[#1a1d2d] border border-white/5 p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-500/50 transition-all hover:-translate-y-1 group relative overflow-hidden flex flex-col"
                      >
                        {chat.assignedTo && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        )}

                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-inner">
                              {chat.name.substring(0,1).toUpperCase()}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-white truncate">{chat.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono truncate">{chat.id.split('@')[0]}</p>
                           </div>
                        </div>
                        
                        <div className="bg-[#131620] p-2.5 rounded-lg border border-white/5 mb-3 flex-1">
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-500"/>
                              {chat.lastMessage}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                           <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                              <UserCircle2 className="w-3 h-3"/> 
                              {chat.assignedTo ? chat.assignedTo : 'Sin asignar'}
                           </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}