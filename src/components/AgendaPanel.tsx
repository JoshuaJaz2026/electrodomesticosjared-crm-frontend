import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Clock, UserCircle2, Plus, X } from "lucide-react";
import { Chat } from "../types";

type Reminder = {
  id: number;
  contact_id: string;
  contact_name: string;
  agent_name: string;
  description: string;
  due_date: string;
  is_completed: boolean;
};

type AgendaPanelProps = {
  isOpen: boolean;
  socket: any;
  agentName: string;
  chats: Chat[]; // 🌟 AÑADIDO: Recibimos los chats para el seleccionador
};

export default function AgendaPanel({ isOpen, socket, agentName, chats }: AgendaPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // 🌟 ESTADOS PARA EL NUEVO MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContactId, setNewContactId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    socket.emit('get-reminders');
    
    const handleLoadReminders = (data: Reminder[]) => setReminders(data);
    socket.on('load-reminders', handleLoadReminders);
    
    return () => { socket.off('load-reminders', handleLoadReminders); };
  }, [isOpen, socket]);

  if (!isOpen) return null;

  const pendingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const toggleReminder = (id: number, currentStatus: boolean) => {
    socket.emit('toggle-reminder', { id, isCompleted: !currentStatus });
  };

  // 🌟 FUNCIÓN PARA CREAR RECORDATORIO DESDE LA AGENDA
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactId || !newDesc || !newDate) return;
    
    socket.emit('add-reminder', {
      contactId: newContactId,
      agentName: agentName,
      description: newDesc,
      dueDate: newDate
    });
    
    setIsModalOpen(false);
    setNewContactId("");
    setNewDesc("");
    setNewDate("");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0e14] overflow-hidden animate-in fade-in duration-300 relative">
      
      {/* 🌟 MODAL FLOTANTE PARA NUEVO RECORDATORIO */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131620] border border-white/5 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-[#0b0e14] border-b border-white/5 text-white flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-purple-500"/> Nuevo Recordatorio</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            
            <form onSubmit={handleCreateReminder} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Cliente / Contacto</label>
                <select 
                  value={newContactId} 
                  onChange={e => setNewContactId(e.target.value)} 
                  className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer" 
                  required
                >
                  <option value="" disabled>Selecciona un cliente de tus chats...</option>
                  {chats.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id.split('@')[0]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Descripción de la Tarea</label>
                <input 
                  type="text" 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Ej: Llamar para confirmar instalación..." 
                  className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  value={newDate} 
                  onChange={e => setNewDate(e.target.value)} 
                  className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-slate-300 focus:ring-1 focus:ring-purple-500 outline-none style-color-scheme-dark" 
                  required 
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 mt-2 shadow-lg shadow-purple-900/20 transition-all">
                <Plus className="w-4 h-4"/> Guardar Tarea
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="p-6 bg-[#131620] border-b border-white/5 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-purple-500"/> Agenda y Follow-ups
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gestiona tus recordatorios y haz seguimiento a tus clientes.</p>
        </div>
        
        {/* 🌟 NUEVO BOTÓN EN LA CABECERA */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 border border-purple-400/20"
        >
          <Plus className="w-4 h-4"/> Nuevo Recordatorio
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          
          {/* TAREAS PENDIENTES */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500"/> Tareas Pendientes ({pendingReminders.length})
            </h3>
            <div className="flex flex-col gap-3">
              {pendingReminders.length === 0 ? (
                <div className="p-6 bg-[#131620] border border-white/5 rounded-2xl text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <p>No tienes recordatorios pendientes. ¡Buen trabajo!</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-purple-400 font-bold hover:text-purple-300 text-xs underline mt-2">Agendar una nueva tarea</button>
                </div>
              ) : (
                pendingReminders.map(r => (
                  <div key={r.id} className="bg-[#131620] p-4 border border-white/5 rounded-2xl shadow-sm flex items-start gap-4 group transition-colors hover:border-purple-500/30">
                    <button onClick={() => toggleReminder(r.id, r.is_completed)} className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors">
                      <Circle className="w-6 h-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-white font-medium mb-1">{r.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold mt-2">
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3"/> {new Date(r.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md"><UserCircle2 className="w-3 h-3"/> {r.contact_name || r.contact_id.split('@')[0]}</span>
                        <span className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20">Por: {r.agent_name}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TAREAS COMPLETADAS */}
          {completedReminders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500"/> Completadas ({completedReminders.length})
              </h3>
              <div className="flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
                {completedReminders.map(r => (
                  <div key={r.id} className="bg-[#131620] p-4 border border-white/5 rounded-2xl flex items-start gap-4">
                    <button onClick={() => toggleReminder(r.id, r.is_completed)} className="mt-1 text-emerald-500 hover:text-slate-500 transition-colors">
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-slate-400 font-medium mb-1 line-through">{r.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold mt-2">
                        <span className="text-slate-500 bg-white/5 px-2 py-1 rounded-md">{new Date(r.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span className="text-slate-500 bg-white/5 px-2 py-1 rounded-md flex items-center gap-1"><UserCircle2 className="w-3 h-3"/> {r.contact_name || r.contact_id.split('@')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}