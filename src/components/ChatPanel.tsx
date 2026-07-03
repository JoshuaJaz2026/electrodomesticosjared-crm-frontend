import React from 'react';
import { Send, Zap, Package, Paperclip, StickyNote, Loader2, Image as ImageIcon, FileText, Bot, Archive, Info, Check, CheckCheck, MessageSquare, Sparkles } from 'lucide-react';
import { Chat, Message, CRMData, QuickReply } from '../types';

interface ChatPanelProps {
  activeChat: Chat | null;
  isConnected: boolean;
  messages: Message[];
  loadingPercent: number;
  loadingMessage: string;
  isAutoPilotActive: boolean;
  setIsAutoPilotActive: React.Dispatch<React.SetStateAction<boolean>>;
  isAISummarizing: boolean;
  setIsAISummarizing: React.Dispatch<React.SetStateAction<boolean>>;
  setShowContactInfo: React.Dispatch<React.SetStateAction<boolean>>;
  showContactInfo: boolean;
  getLabelColor: (labelName: string | null) => string;
  enlargedImage: string | null;
  setEnlargedImage: React.Dispatch<React.SetStateAction<string | null>>;
  pedirTranscripcion: (msg: Message) => void;
  isTranscribing: Record<string, boolean>;
  transcriptions: Record<string, string>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  attachment: { file: File, base64: string, type: 'image' | 'document' } | null;
  setAttachment: React.Dispatch<React.SetStateAction<{ file: File, base64: string, type: 'image' | 'document' } | null>>;
  showSnippets: boolean;
  filteredSnippets: QuickReply[];
  handleSelectSnippet: (text: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isNoteMode: boolean;
  setIsNoteMode: React.Dispatch<React.SetStateAction<boolean>>;
  isAIGenerating: boolean;
  setIsAIGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCatalogModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inputRef: React.RefObject<HTMLInputElement>;
  inputText: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  socket: any; 
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  chats: Chat[];
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  agentName: string | null;
}

export default function ChatPanel({
  activeChat, isConnected, messages, loadingPercent, loadingMessage,
  isAutoPilotActive, setIsAutoPilotActive, isAISummarizing, setIsAISummarizing,
  setShowContactInfo, showContactInfo, getLabelColor, enlargedImage, setEnlargedImage,
  pedirTranscripcion, isTranscribing, transcriptions, messagesEndRef,
  attachment, setAttachment, showSnippets, filteredSnippets, handleSelectSnippet,
  handleSendMessage, fileInputRef, handleFileChange, isNoteMode, setIsNoteMode,
  isAIGenerating, setIsAIGenerating, setIsCatalogModalOpen, inputRef, inputText,
  handleInputChange, socket, setChats, chats, setActiveChat, agentName
}: ChatPanelProps) {

  const chatMessages = messages.filter(m => !m.isNote);

  return (
    <main className="flex-1 flex flex-col bg-[#0b0e14] min-w-0 border-r border-white/5">
      <header className="p-4 bg-[#131620] border-b border-white/5 flex items-center justify-between shadow-sm z-10 transition-colors h-[72px] flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => activeChat && setShowContactInfo(prev => !prev)}>
          {activeChat ? (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-lg relative">
                {activeChat.name.substring(0, 1).toUpperCase()}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#131620] rounded-full"></span>
              </div>
              <div>
                <h2 className="font-semibold text-white flex items-center gap-2">
                  {activeChat.name}
                  {activeChat.label && activeChat.label !== "Archivado" && (<span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${getLabelColor(activeChat.label)}`}>{activeChat.label}</span>)}
                </h2>
                <p className="text-xs text-emerald-400 font-medium">En línea</p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="font-semibold text-white">Atención al Cliente</h2>
              <p className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-500'}`}>{isConnected ? 'Conectado al bot • Selecciona un chat' : 'Iniciando sistema...'}</p>
            </div>
          )}
        </div>

        {/* 🌟 BOTONES DE ACCIÓN DEL CHAT */}
        {activeChat && (
          <div className="flex items-center gap-1 z-50">
            {/* 🤖 BOTÓN INTERRUPTOR: PILOTO AUTOMÁTICO IA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newState = !isAutoPilotActive;
                setIsAutoPilotActive(newState);
                socket.emit('toggle-autopilot', { chatId: activeChat.id, isActive: newState });
              }}
              className={`p-2 rounded-full transition-colors flex-shrink-0 border ${isAutoPilotActive ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-transparent text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}
              title={isAutoPilotActive ? "Piloto Automático ENCENDIDO" : "Piloto Automático APAGADO"}
            >
              <Zap className={`w-5 h-5 ${isAutoPilotActive ? 'fill-indigo-400' : ''}`} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isAISummarizing) return;
                setIsAISummarizing(true);
                socket.emit('ai-summarize-chat', { chatId: activeChat.id });
              }}
              className="p-2 rounded-full transition-colors flex-shrink-0 bg-transparent text-slate-500 hover:text-white hover:bg-white/5"
              title="Resumir conversación con IA"
            >
              {isAISummarizing ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Bot className="w-5 h-5 text-purple-400" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const newLabel = activeChat.label === "Archivado" ? null : "Archivado";
                socket.emit("update-label", { chatId: activeChat.id, label: newLabel });
                setActiveChat({ ...activeChat, label: newLabel });
                setChats(chats.map(c => c.id === activeChat.id ? { ...c, label: newLabel } : c));
              }}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${activeChat.label === "Archivado" ? 'bg-slate-700/50 text-slate-300' : 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}
              title={activeChat.label === "Archivado" ? "Desarchivar Chat" : "Archivar Chat"}
            >
              <Archive className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowContactInfo(prev => !prev);
              }}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${showContactInfo ? 'bg-purple-500/20 text-purple-400' : 'bg-transparent text-slate-500 hover:text-white hover:bg-white/5'}`}
              title="Mostrar información del contacto"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* 🌟 BARRA DE CARGA VISUAL */}
      {loadingPercent > 0 && loadingPercent < 100 && (
        <div className="px-4 py-3 bg-[#131620] border-b border-white/5 flex-shrink-0 z-10 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
              Sincronizando Historial de WhatsApp
            </span>
            <span className="text-xs font-bold text-purple-400">{loadingPercent}%</span>
          </div>
          <div className="w-full bg-[#0b0e14] rounded-full h-1.5 border border-white/5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-indigo-500 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingPercent}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5 truncate text-right">{loadingMessage || 'Descargando mensajes de la nube...'}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-3 min-w-0">
        {!activeChat ? (
          <div className="flex items-center justify-center h-full flex-col opacity-50"><MessageSquare className="w-16 h-16 text-slate-600 mb-4" /><p className="text-sm text-slate-500 bg-[#131620] border border-white/5 px-6 py-2 rounded-full shadow-sm">Selecciona un contacto para iniciar</p></div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center mt-10"><p className="text-xs text-slate-500 bg-[#131620] border border-white/5 px-3 py-1 rounded-full shadow-sm">Sincronizando historial...</p></div>
        ) : (
          <>
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col max-w-md mb-2 ${msg.isMine ? 'self-end' : 'self-start'}`}>
                {msg.isMine && msg.agentName && (<span className="text-[9px] text-slate-500 mb-0.5 text-right font-medium pr-1">Enviado por {msg.agentName}</span>)}
                <div className={`p-3 text-sm shadow-sm flex flex-col ${msg.isMine ? 'bg-[#9900ff] text-white rounded-2xl rounded-tr-none shadow-purple-900/20' : 'bg-[#1a1d2d] text-slate-200 border border-white/5 rounded-2xl rounded-tl-none'}`}>
                  {msg.mediaUrl && msg.mimeType?.startsWith('image/') && (<img src={msg.mediaUrl} alt="Imagen adjunta" onClick={() => setEnlargedImage(msg.mediaUrl!)} className="max-w-[220px] max-h-[220px] object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity border border-white/10" />)}

                  {msg.mediaUrl && msg.mimeType?.startsWith('audio/') && (
                    <div className="flex flex-col mb-2">
                      <audio controls src={msg.mediaUrl} className="max-w-[250px] h-10" />
                      <div className="mt-2 flex flex-col items-start gap-1">
                        <button
                          onClick={() => pedirTranscripcion(msg)}
                          disabled={isTranscribing[msg.id]}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${msg.isMine ? 'bg-purple-800 hover:bg-purple-700 text-white' : 'bg-[#131620] hover:bg-[#0b0e14] border border-white/10 text-white'}`}
                        >
                          {isTranscribing[msg.id] ? '⏳ Transcribiendo...' : '✨ Transcribir audio'}
                        </button>
                        {transcriptions[msg.id] && (
                          <p className={`text-xs mt-1 italic p-2 rounded-lg leading-relaxed ${msg.isMine ? 'bg-purple-800/50' : 'bg-[#131620]/50 border border-white/5'}`}>
                            🎙️ <strong>IA:</strong> {transcriptions[msg.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.mediaUrl && !msg.mimeType?.startsWith('image/') && !msg.mimeType?.startsWith('audio/') && (<a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-purple-300 underline text-sm mb-2 font-medium"><FileText className="w-4 h-4" /> Descargar Documento</a>)}
                  {msg.body && <span className="leading-relaxed whitespace-pre-wrap break-words break-all">{msg.body}</span>}
                </div>
                <span className={`text-[10px] text-slate-500 mt-1 font-medium flex items-center gap-1 ${msg.isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {msg.isMine && '• Tú'}
                  {msg.isMine && !msg.isNote && (
                    <span className="inline-flex">
                      {(msg.ack === 1 || msg.ack === 2) && <Check className="w-3 h-3 text-slate-500" />}
                      {msg.ack === 3 && <CheckCheck className="w-3 h-3 text-slate-500" />}
                      {msg.ack === 4 && <CheckCheck className="w-3 h-3 text-[#9900ff]" />}
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="p-4 bg-[#131620] border-t border-white/5 z-10 relative">
        {attachment && (
          <div className="absolute bottom-full left-4 mb-2 p-2 bg-[#1a1d2d] border border-white/10 rounded-xl shadow-lg flex items-center gap-3 w-64 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-[#0b0e14] p-2 rounded-lg flex-shrink-0">
              {attachment.type === 'image' ? <ImageIcon className="w-6 h-6 text-emerald-500" /> : <FileText className="w-6 h-6 text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-300 truncate">{attachment.file.name}</p>
              <p className="text-[10px] text-slate-500">{(attachment.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => setAttachment(null)} className="p-1.5 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition"><X className="w-4 h-4" /></button>
          </div>
        )}

        {showSnippets && activeChat && (
          <div className="absolute bottom-full left-4 mb-2 w-[400px] bg-[#1a1d2d] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-[#131620] p-3 text-xs font-bold text-slate-400 border-b border-white/5 flex justify-between items-center"><span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Respuestas Rápidas</span></div>
            <div className="max-h-60 overflow-y-auto">
              {filteredSnippets.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center bg-[#0b0e14] flex flex-col items-center gap-2"><p>No hay atajos que coincidan</p></div>
              ) : (
                filteredSnippets.map((snippet, idx) => (
                  <div key={idx} onClick={() => handleSelectSnippet(snippet.text)} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="font-bold text-sm text-purple-400 mb-1">{snippet.shortcut}</div>
                    <div className="text-xs text-slate-400 line-clamp-2">{snippet.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className={`flex items-center gap-2 p-2 rounded-xl border shadow-sm transition-all duration-300 bg-[#0b0e14] border-white/5 ${!activeChat ? 'opacity-50' : 'opacity-100 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50'} ${isNoteMode ? 'border-amber-500/30 ring-1 ring-amber-500/30' : ''}`}>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,.doc,.docx" />

          <button type="button" onClick={() => setIsNoteMode(!isNoteMode)} disabled={!activeChat} title="Alternar Modo Nota Interna" className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isNoteMode ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><StickyNote className="w-5 h-5" /></button>

          {!isNoteMode && (
            <button
              type="button"
              onClick={() => {
                if (isAIGenerating) return;
                setIsAIGenerating(true);
                socket.emit('ai-generate-reply', { chatId: activeChat.id });
              }}
              disabled={!activeChat || isAIGenerating}
              title="Generar respuesta ideal con IA"
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            >
              {isAIGenerating ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Sparkles className="w-5 h-5 text-purple-400" />}
            </button>
          )}

          {!isNoteMode && (
            <button type="button" onClick={() => setIsCatalogModalOpen(true)} disabled={!activeChat} title="Abrir Catálogo de Productos" className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0">
              <Package className="w-5 h-5" />
            </button>
          )}

          {!isNoteMode && (<button type="button" onClick={() => fileInputRef.current?.click()} disabled={!activeChat} title="Adjuntar Archivo" className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"><Paperclip className="w-5 h-5" /></button>)}

          <input ref={inputRef} type="text" value={inputText} onChange={handleInputChange} placeholder={!activeChat ? "Selecciona un chat primero..." : isNoteMode ? "Escribiendo nota interna (No se enviará al cliente)..." : "Escribe un mensaje o usa '/' para respuestas rápidas..."} className={`flex-1 bg-transparent outline-none px-2 text-sm transition-colors ${isNoteMode ? 'text-amber-400 placeholder:text-amber-500/50' : 'text-slate-200 placeholder:text-slate-600'}`} disabled={!activeChat} autoComplete="off" />
          <button type="submit" disabled={!activeChat || (!inputText.trim() && !attachment)} className={`p-2.5 rounded-lg text-white disabled:opacity-50 transition-colors cursor-pointer flex-shrink-0 ${isNoteMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#9900ff] hover:bg-[#8800e6]'}`}><Send className="w-4 h-4" /></button>
        </form>
      </footer>
    </main>
  );
}