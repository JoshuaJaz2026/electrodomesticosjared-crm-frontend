import { useState, useEffect } from "react";
import { UserCircle2, StickyNote, FileText, Tag, Send, CalendarDays, Wrench, Plus, Circle, CheckCircle2, X, Users, Clock } from "lucide-react";
import { Chat, CustomLabel, CRMData } from "../types";

type Ticket = {
  id: number;
  contact_id: string;
  agent_name: string;
  subject: string;
  description: string;
  serial_number: string;
  status: string;
  created_at: string;
};

type ActivityLog = {
  id: number;
  contact_id: string;
  agent_name: string;
  action_type: string;
  description: string;
  created_at: string;
};

type RightPanelProps = {
  activeChat: Chat;
  setShowContactInfo: (show: boolean) => void;
  handleLabelChange: (label: string) => void;
  customLabels: CustomLabel[];
  crmForm: CRMData;
  handleCRMChange: (field: keyof CRMData, value: string) => void;
  handleSaveCRM: () => void;
  isSavingCRM: boolean;
  noteInput: string;
  setNoteInput: (val: string) => void;
  handleSaveNote: () => void;
  internalNotes: any[];
  getLabelColor: (labelName: string | null) => string;
  socket: any;
  agentName: string;
};

export default function RightPanel({
  activeChat, setShowContactInfo, handleLabelChange, customLabels,
  crmForm, handleCRMChange, handleSaveCRM, isSavingCRM,
  noteInput, setNoteInput, handleSaveNote, internalNotes, getLabelColor,
  socket, agentName
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'crm' | 'notes' | 'tickets' | 'timeline'>('crm');
  
  // Estados para Agenda
  const [newReminderDesc, setNewReminderDesc] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  
  // Estados para Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", serialNumber: "" });
  
  // Estados para Usuarios y Logs
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!activeChat) return;
    
    // Cargar Tickets
    socket.emit('get-tickets', activeChat.id);
    const handleLoadTickets = (data: Ticket[]) => setTickets(data);
    socket.on('load-tickets', handleLoadTickets);

    // Cargar Usuarios para Asignación
    socket.emit('get-users');
    const handleLoadUsers = (users: any[]) => setAppUsers(users);
    socket.on('load-users', handleLoadUsers);

    // Cargar Historial
    socket.emit('get-activity-logs', activeChat.id);
    const handleLoadLogs = (data: ActivityLog[]) => setActivityLogs(data);
    socket.on('load-activity-logs', handleLoadLogs);

    return () => { 
        socket.off('load-tickets', handleLoadTickets); 
        socket.off('load-users', handleLoadUsers); 
        socket.off('load-activity-logs', handleLoadLogs);
    };
  }, [activeChat, socket]);

  const handleSaveReminder = () => {
    if (!newReminderDesc || !newReminderDate) return;
    socket.emit('add-reminder', { contactId: activeChat.id, agentName: agentName, description: newReminderDesc, dueDate: newReminderDate });
    socket.emit('add-activity-log', { contactId: activeChat.id, agentName, actionType: 'AGENDA', description: `Agendó un recordatorio: ${newReminderDesc}` });
    setIsAddingReminder(false); setNewReminderDesc(""); setNewReminderDate("");
  };

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject || !ticketForm.description) return;
    socket.emit('create-ticket', { contactId: activeChat.id, agentName: agentName, subject: ticketForm.subject, description: ticketForm.description, serialNumber: ticketForm.serialNumber });
    socket.emit('add-activity-log', { contactId: activeChat.id, agentName, actionType: 'SOPORTE', description: `Creó un ticket de soporte: ${ticketForm.subject}` });
    setIsAddingTicket(false); setTicketForm({ subject: "", description: "", serialNumber: "" });
  };

  const toggleTicketStatus = (ticket: Ticket) => {
    const newStatus = ticket.status === 'Abierto' ? 'Cerrado' : 'Abierto';
    socket.emit('update-ticket-status', { id: ticket.id, status: newStatus, contactId: activeChat.id });
    socket.emit('add-activity-log', { contactId: activeChat.id, agentName, actionType: 'SOPORTE', description: `Cambió el estado del ticket TKT-${ticket.id} a ${newStatus}` });
  };

  const handleAssignAgent = (newAgent: string) => {
    socket.emit('assign-agent', { chatId: activeChat.id, agentName: newAgent });
    socket.emit('add-activity-log', { contactId: activeChat.id, agentName, actionType: 'ASIGNACION', description: `Asignó el chat a: ${newAgent || 'Bandeja Global'}` });
  };

  const onLabelChange = (newLabel: string) => {
    handleLabelChange(newLabel);
    socket.emit('add-activity-log', { contactId: activeChat.id, agentName, actionType: 'ETIQUETA', description: `Cambió la etiqueta a: ${newLabel}` });
  };

  return (
    <aside className="w-80 bg-[#131620] border-l border-white/5 flex flex-col z-20 flex-shrink-0">
      <div className="p-6 border-b border-white/5 flex flex-col items-center relative">
        <button onClick={() => setShowContactInfo(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition"><X className="w-4 h-4" /></button>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-3xl mb-4 shadow-lg border border-white/5">
            {activeChat.name.substring(0, 1).toUpperCase()}
        </div>
        <h3 className="font-black text-lg text-white mb-1 text-center truncate w-full px-2">{activeChat.name}</h3>
        <p className="text-xs text-slate-400 font-medium mb-4 bg-[#0b0e14] px-3 py-1 rounded-full border border-white/5 truncate max-w-full">{activeChat.id.split('@')[0]}</p>
        
        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Tag className="w-3 h-3"/> Etiqueta de Estado</label>
            <select value={activeChat.label || "Sin etiqueta"} onChange={(e) => onLabelChange(e.target.value)} className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer border shadow-sm ${getLabelColor(activeChat.label)}`}>
              <option value="Sin etiqueta" className="bg-[#131620] text-slate-300">Sin etiqueta</option>
              {customLabels.map((lbl, idx) => ( <option key={idx} value={lbl.name} className="bg-[#131620] text-slate-300">{lbl.name}</option> ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> Asignado a</label>
            <select 
              value={activeChat.assignedTo || ""} 
              onChange={(e) => handleAssignAgent(e.target.value)} 
              className="w-full p-2.5 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer border bg-[#1a1d2d] text-slate-300 border-white/10 shadow-sm"
            >
              <option value="">Nadie (Bandeja Global)</option>
              {appUsers.map((u) => (
                <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/5 bg-[#0b0e14]">
        <button onClick={() => setActiveTab('crm')} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-colors flex flex-col justify-center items-center gap-1 ${activeTab === 'crm' ? 'text-purple-400 border-b-2 border-purple-500 bg-[#131620]' : 'text-slate-500 hover:text-slate-300'}`}><UserCircle2 className="w-4 h-4"/> Ficha</button>
        <button onClick={() => setActiveTab('notes')} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-colors flex flex-col justify-center items-center gap-1 ${activeTab === 'notes' ? 'text-amber-400 border-b-2 border-amber-500 bg-[#131620]' : 'text-slate-500 hover:text-slate-300'}`}><StickyNote className="w-4 h-4"/> Notas</button>
        <button onClick={() => setActiveTab('tickets')} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-colors flex flex-col justify-center items-center gap-1 ${activeTab === 'tickets' ? 'text-blue-400 border-b-2 border-blue-500 bg-[#131620]' : 'text-slate-500 hover:text-slate-300'}`}><Wrench className="w-4 h-4"/> Tickets</button>
        <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-colors flex flex-col justify-center items-center gap-1 ${activeTab === 'timeline' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-[#131620]' : 'text-slate-500 hover:text-slate-300'}`}><Clock className="w-4 h-4"/> Historial</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-700">
        
        {activeTab === 'crm' && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2">
            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Completo</label><input type="text" value={crmForm.fullName} onChange={(e) => handleCRMChange('fullName', e.target.value)} className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none transition-all" placeholder="Nombre real..." /></div>
            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">DNI / RUC</label><input type="text" value={crmForm.documentId} onChange={(e) => handleCRMChange('documentId', e.target.value)} className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none transition-all" placeholder="Documento..." /></div>
            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Dirección de Envío</label><input type="text" value={crmForm.address} onChange={(e) => handleCRMChange('address', e.target.value)} className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none transition-all" placeholder="Calle/Avenida..." /></div>
            <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Distrito</label><input type="text" value={crmForm.district} onChange={(e) => handleCRMChange('district', e.target.value)} className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none transition-all" placeholder="Distrito..." /></div>
            <button onClick={handleSaveCRM} disabled={isSavingCRM} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-sm transition-all flex justify-center items-center gap-2 mt-2 shadow-lg shadow-purple-900/20 disabled:opacity-50">{isSavingCRM ? 'Guardando...' : 'Guardar Cambios'}</button>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2">
             <div className="mb-4">
                {isAddingReminder ? (
                    <div className="bg-[#0b0e14] p-3 rounded-xl border border-purple-500/30">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nueva Tarea</label>
                        <input type="text" value={newReminderDesc} onChange={e => setNewReminderDesc(e.target.value)} placeholder="Ej: Llamar para confirmar..." className="w-full mb-2 p-2 bg-[#1a1d2d] border border-white/5 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-purple-500" />
                        <input type="datetime-local" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className="w-full mb-3 p-2 bg-[#1a1d2d] border border-white/5 rounded-lg text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500 style-color-scheme-dark" />
                        <div className="flex gap-2">
                            <button onClick={handleSaveReminder} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded-lg text-xs font-bold transition-all">Guardar</button>
                            <button onClick={() => setIsAddingReminder(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-1.5 rounded-lg text-xs font-bold transition-all">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingReminder(true)} className="w-full border border-dashed border-white/10 hover:border-purple-500/50 text-slate-500 hover:text-purple-400 py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 bg-[#0b0e14]"><CalendarDays className="w-4 h-4"/> Agendar Seguimiento</button>
                )}
             </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {internalNotes.length === 0 ? ( <div className="text-center text-slate-500 text-xs mt-10 opacity-50"><StickyNote className="w-8 h-8 mx-auto mb-2"/> Sin notas internas</div> ) : (
                internalNotes.map((note, idx) => (
                  <div key={idx} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <p className="text-xs text-amber-500/80 mb-1 font-bold flex justify-between"><span>Por {note.agentName}</span><span>{new Date(note.timestamp).toLocaleDateString()}</span></p>
                    <p className="text-sm text-amber-100/90 leading-relaxed">{note.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 relative">
              <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Escribir nota secreta..." className="w-full h-24 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm resize-none text-white focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600" />
              <button onClick={handleSaveNote} disabled={!noteInput.trim()} className="absolute bottom-3 right-3 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg disabled:opacity-50 transition-colors shadow-lg"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2">
             <div className="mb-4">
                {isAddingTicket ? (
                    <form onSubmit={handleSaveTicket} className="bg-[#0b0e14] p-4 rounded-xl border border-blue-500/30 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Wrench className="w-3 h-3"/> Nuevo Ticket</h4>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motivo / Asunto</label>
                            <input type="text" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} placeholder="Ej: Falla en motor..." className="w-full p-2 bg-[#1a1d2d] border border-white/5 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" required />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N° de Serie (Opcional)</label>
                            <input type="text" value={ticketForm.serialNumber} onChange={e => setTicketForm({...ticketForm, serialNumber: e.target.value})} placeholder="SN-123456789" className="w-full p-2 bg-[#1a1d2d] border border-white/5 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descripción Detallada</label>
                            <textarea value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} placeholder="Detalla el problema..." className="w-full h-20 resize-none p-2 bg-[#1a1d2d] border border-white/5 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-blue-500" required />
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20">Crear Ticket</button>
                            <button type="button" onClick={() => setIsAddingTicket(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-lg text-xs font-bold transition-all">Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setIsAddingTicket(true)} className="w-full border border-dashed border-white/10 hover:border-blue-500/50 text-slate-500 hover:text-blue-400 py-3 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 bg-[#0b0e14]"><Plus className="w-4 h-4"/> Generar Reclamo / Soporte</button>
                )}
             </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
              {tickets.length === 0 ? ( 
                <div className="text-center text-slate-500 text-xs mt-10 opacity-50 flex flex-col items-center">
                    <Wrench className="w-8 h-8 mb-2"/> No hay tickets de soporte para este cliente
                </div> 
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl relative group hover:border-blue-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${ticket.status === 'Abierto' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {ticket.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">TKT-{ticket.id}</span>
                    </div>
                    
                    <h5 className="text-sm font-bold text-white leading-tight mb-1">{ticket.subject}</h5>
                    {ticket.serial_number && <p className="text-[10px] text-blue-400 font-mono mb-2">Serie: {ticket.serial_number}</p>}
                    
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">{ticket.description}</p>
                    
                    <div className="flex justify-between items-center border-t border-white/5 pt-2">
                        <span className="text-[9px] font-bold text-slate-500">Por {ticket.agent_name}</span>
                        <button 
                            onClick={() => toggleTicketStatus(ticket)} 
                            className="text-[10px] font-bold flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-md"
                        >
                            {ticket.status === 'Abierto' ? <><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Marcar Resuelto</> : <><Circle className="w-3 h-3 text-amber-500"/> Reabrir</>}
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2">
            <div className="flex-1 overflow-y-auto pr-2 relative">
              {activityLogs.length === 0 ? (
                <div className="text-center text-slate-500 text-xs mt-10 opacity-50 flex flex-col items-center">
                    <Clock className="w-8 h-8 mb-2"/> No hay actividad reciente
                </div>
              ) : (
                <div className="border-l-2 border-white/10 ml-3 mt-2 space-y-6 pb-6">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#131620] border-2 border-emerald-500 flex items-center justify-center"></span>
                      <div className="bg-[#0b0e14] border border-white/5 p-3 rounded-xl shadow-sm hover:border-emerald-500/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">{log.action_type}</span>
                            <span className="text-[9px] text-slate-500 font-medium">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed mb-2">{log.description}</p>
                        <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                            <UserCircle2 className="w-3 h-3"/> {log.agent_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}