"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { MessageSquare, Settings, Zap, Plus, Trash2, X, Tag, LogIn, Lock, Kanban, LayoutDashboard, LogOut, ChevronLeft, ChevronRight, CalendarDays, Package, Archive } from "lucide-react";
import { Chat, Message, QuickReply, CustomLabel, CRMData } from "../types";

import Sidebar from "../components/Sidebar"; 
import RightPanel from "../components/RightPanel";
import AdminPanel from "../components/AdminPanel"; 
import StatsPanel from "../components/StatsPanel"; 
import KanbanBoard from "../components/KanbanBoard"; 
import AgendaPanel from "../components/AgendaPanel";
import CatalogModal from "../components/CatalogModal"; 
import ChatPanel from "../components/ChatPanel"; 

const socket = io("http://localhost:3001");

const DEFAULT_REPLIES: QuickReply[] = [
  { shortcut: "/saludo", text: "¡Hola! Gracias por comunicarte con Electrodomésticos Jared. ¿En qué te podemos ayudar hoy?" },
  { shortcut: "/cuenta", text: "Nuestro número de cuenta BCP es: 191-XXXXX-X-XX a nombre de Electrodomésticos Jared." }
];

const DEFAULT_LABELS: CustomLabel[] = [
  { name: "Pendiente", color: "bg-rose-500 text-white border-rose-400" },
  { name: "Atendiendo", color: "bg-blue-500 text-white border-blue-400" },
  { name: "Venta Cerrada", color: "bg-emerald-500 text-white border-emerald-400" }
];

const COLOR_OPTIONS = [
  { name: "Azul", class: "bg-blue-500 text-white border-blue-400" },
  { name: "Verde", class: "bg-emerald-500 text-white border-emerald-400" },
  { name: "Rojo", class: "bg-rose-500 text-white border-rose-400" },
  { name: "Amarillo", class: "bg-amber-500 text-white border-amber-400" },
  { name: "Morado", class: "bg-purple-500 text-white border-purple-400" },
  { name: "Rosa", class: "bg-pink-500 text-white border-pink-400" },
  { name: "Naranja", class: "bg-orange-500 text-white border-orange-400" },
  { name: "Cian", class: "bg-cyan-500 text-white border-cyan-400" },
  { name: "Lima", class: "bg-lime-500 text-black border-lime-400" },
  { name: "Fucsia", class: "bg-fuchsia-500 text-white border-fuchsia-400" },
  { name: "Índigo", class: "bg-indigo-500 text-white border-indigo-400" },
  { name: "Gris", class: "bg-slate-500 text-white border-slate-400" }
];

const DEFAULT_CRM_DATA: CRMData = { fullName: "", documentId: "", email: "", altPhone: "", address: "", district: "", reference: "", customerType: "Minorista" };

type AppView = 'chats' | 'kanban' | 'stats' | 'admin' | 'agenda';

export default function Dashboard() {
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentRole, setAgentRole] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [currentView, setCurrentView] = useState<AppView>('chats');
  
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSnippets, setShowSnippets] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
  
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  
  const [newShortcut, setNewShortcut] = useState("");
  const [newReplyText, setNewReplyText] = useState("");
  const [customLabels, setCustomLabels] = useState<CustomLabel[]>([]);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(COLOR_OPTIONS[0].class);
  const [activeFilter, setActiveFilter] = useState<string>("Todas"); 
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [crmForm, setCrmForm] = useState<CRMData>(DEFAULT_CRM_DATA);
  const [isSavingCRM, setIsSavingCRM] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{ file: File, base64: string, type: 'image' | 'document' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [globalReminders, setGlobalReminders] = useState<any[]>([]);
  const notifiedReminders = useRef<Set<number>>(new Set());

  // 🌟 ESTADOS PARA INTELIGENCIA ARTIFICIAL Y BARRA DE CARGA
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isAISummarizing, setIsAISummarizing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, string>>({});
  const [isTranscribing, setIsTranscribing] = useState<Record<string, boolean>>({});
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(false);

  useEffect(() => {
    const savedAgent = localStorage.getItem("crm_agent_name");
    const savedRole = localStorage.getItem("crm_agent_role");
    if (savedAgent) { setAgentName(savedAgent); setAgentRole(savedRole); }
    const savedReplies = localStorage.getItem("crm_quick_replies");
    if (savedReplies) setQuickReplies(JSON.parse(savedReplies)); else setQuickReplies(DEFAULT_REPLIES);
    const savedLabels = localStorage.getItem("crm_custom_labels");
    if (savedLabels) setCustomLabels(JSON.parse(savedLabels)); else setCustomLabels(DEFAULT_LABELS);

    const onReady = () => { 
        setIsConnected(true); 
        socket.emit("request-chats"); 
    };
    
    const onLoadChats = (loadedChats: Chat[]) => {
        setChats(loadedChats);
        setLoadingPercent(0); 
        setLoadingMessage("");
    };

    socket.on('login-success', (data) => {
        setAgentName(data.username); setAgentRole(data.role);
        localStorage.setItem("crm_agent_name", data.username); localStorage.setItem("crm_agent_role", data.role);
        setLoginError("");
        socket.emit('get-reminders'); 
    });
    
    socket.on('login-error', (msg) => { setLoginError(msg); });
    socket.on("whatsapp-ready", onReady);
    socket.on("load-chats", onLoadChats);
    socket.on("connect", () => socket.emit("check-status"));
    
    socket.on("session-loading", (data: { percent: number, message: string }) => {
        setLoadingPercent(data.percent);
        setLoadingMessage(data.message);
    });

    if (socket.connected) socket.emit("check-status");

    return () => { 
        socket.off("whatsapp-ready", onReady); socket.off("load-chats", onLoadChats); 
        socket.off("connect"); socket.off("login-success"); socket.off("login-error");
        socket.off("session-loading"); 
    };
  }, []);

  useEffect(() => {
    socket.on('ai-reply-success', (data) => {
        setInputText(data.text);
        setIsAIGenerating(false);
    });
    
    socket.on('ai-reply-error', (err) => {
        alert("Error IA: " + err);
        setIsAIGenerating(false);
    });

    socket.on('ai-summary-success', (data) => {
        if (activeChat && agentName) {
            const summaryNote = `🤖 RESUMEN IA:\n${data.summary}`;
            socket.emit("send-note", { to: activeChat.id, text: summaryNote, agentName: agentName + " (IA)" });
            setMessages((prev) => [...prev, { id: 'note_'+Date.now(), from: "me", body: summaryNote, timestamp: new Date() as any, isMine: true, isNote: true, agentName: agentName + " (IA)" }]);
        }
        setIsAISummarizing(false);
    });

    socket.on('ai-summary-error', (err) => {
        alert("Error IA: " + err);
        setIsAISummarizing(false);
    });

    socket.on('ai-transcribe-success', (data: { messageId: string, text: string }) => {
        setIsTranscribing(prev => ({ ...prev, [data.messageId]: false }));
        setTranscriptions(prev => ({ ...prev, [data.messageId]: data.text }));
    });

    socket.on('ai-transcribe-error', (err: string) => {
        alert("Error IA (Transcripción): " + err);
        setIsTranscribing({}); 
    });

    // 🌟 NUEVOS LISTENERS: Para la creación de cotizaciones y enlaces mágicos
    socket.on('quote-created', (data: { quoteId: string, quoteUrl: string, contactId: string, text: string }) => {
        if (data.contactId) {
            // Agregamos el enlace mágico al final del mensaje base que habíamos creado
            const finalMessage = `${data.text}✨ *Visualiza y paga tu cotización aquí:*\n${data.quoteUrl}\n\n_¿Te gustaría que procedamos con la compra o tienes alguna duda adicional?_`;
            
            // AHORA SÍ enviamos el mensaje completo con el enlace a WhatsApp
            socket.emit("send-message", {
                to: data.contactId,
                text: finalMessage,
                agentName: agentName || "Asesor",
                sessionId: "Ventas_Principal"
            });
        }
    });

    socket.on('quote-error', (msg: string) => {
        alert("Error al generar la cotización: " + msg);
    });

    return () => {
        socket.off('ai-reply-success');
        socket.off('ai-reply-error');
        socket.off('ai-summary-success');
        socket.off('ai-summary-error');
        socket.off('ai-transcribe-success');
        socket.off('ai-transcribe-error');
        socket.off('quote-created');
        socket.off('quote-error');
    };
  }, [activeChat, agentName]);

  useEffect(() => {
    socket.on("load-history", (data: { chatId: string, messages: Message[] }) => {
        if (activeChat && data.chatId === activeChat.id) setMessages(data.messages);
    });

    socket.on("load-reminders", (data: any[]) => {
        setGlobalReminders(data);
    });

    socket.on("whatsapp-message", (msg) => {
      if (activeChat && msg.from === activeChat.id) {
          setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, { ...msg, isNote: false }];
          });
      }
      setChats((prevChats) => {
          const chatIndex = prevChats.findIndex(c => c.id === msg.from);
          const newLastMessage = msg.summaryText || msg.body || '[Mensaje]';
          if (chatIndex > -1) {
              const updatedChat = { ...prevChats[chatIndex], lastMessage: newLastMessage };
              const newChats = [...prevChats];
              newChats.splice(chatIndex, 1); newChats.unshift(updatedChat); 
              return newChats;
          } else {
              const newChat: Chat = { id: msg.from, name: msg.contactName || msg.from.split('@')[0], lastMessage: newLastMessage, label: null, crmData: DEFAULT_CRM_DATA };
              return [newChat, ...prevChats];
          }
      });
    });

    socket.on("message-ack", (data: { messageId: string, ack: number }) => {
        setMessages((prev) => prev.map((msg) => msg.id === data.messageId ? { ...msg, ack: data.ack } : msg));
    });

    socket.on("label-updated", (data: { chatId: string, label: string | null }) => {
      setChats((prevChats) => prevChats.map((c) => c.id === data.chatId ? { ...c, label: data.label } : c));
      setActiveChat((prev) => prev?.id === data.chatId ? { ...prev, label: data.label } : prev);
    });

    socket.on("contact-info-updated", (data: CRMData & { chatId: string }) => {
      setChats((prevChats) => prevChats.map((c) => c.id === data.chatId ? { ...c, crmData: data } : c));
      setActiveChat((prev) => {
        if (prev?.id === data.chatId) { setCrmForm(data); return { ...prev, crmData: data }; }
        return prev;
      });
    });

    socket.on("agent-assigned", (data: { chatId: string, agentName: string | null }) => {
      setChats((prevChats) => prevChats.map((c) => c.id === data.chatId ? { ...c, assignedTo: data.agentName } : c));
      setActiveChat((prev) => prev?.id === data.chatId ? { ...prev, assignedTo: data.agentName } : prev);
    });

    socket.on('autopilot-status', (data: { chatId: string, isActive: boolean }) => {
      if (activeChat && activeChat.id === data.chatId) {
          setIsAutoPilotActive(data.isActive);
      }
    });

    return () => {
      socket.off("load-history"); socket.off("whatsapp-message"); socket.off("message-ack");
      socket.off("label-updated"); socket.off("contact-info-updated"); socket.off("load-reminders");
      socket.off("agent-assigned"); socket.off("autopilot-status");
    };
  }, [activeChat]);

  useEffect(() => {
    if (!agentName) return;

    const interval = setInterval(() => {
        const now = new Date();
        globalReminders.forEach(r => {
            if (!r.is_completed) {
                const dueDate = new Date(r.due_date);
                const diffMs = now.getTime() - dueDate.getTime();
                
                if (diffMs >= 0 && diffMs < 60000 && !notifiedReminders.current.has(r.id)) {
                    if (Notification.permission === "granted") {
                        const clienteNombre = r.contact_name || r.contact_id.split('@')[0];
                        new Notification("⏰ Jared CRM - Recordatorio", {
                            body: `${r.description}\nCliente: ${clienteNombre}`,
                            icon: "https://cdn-icons-png.flaticon.com/512/825/825590.png"
                        });
                        notifiedReminders.current.add(r.id);
                    }
                }
            }
        });
    }, 10000); 

    return () => clearInterval(interval);
  }, [globalReminders, agentName]);

  useEffect(() => {
    if (activeChat) {
      setMessages([]); setShowContactInfo(false); setIsNoteMode(false); setAttachment(null);
      setCrmForm(activeChat.crmData || DEFAULT_CRM_DATA);
      socket.emit("request-history", activeChat.id);
      
      // 🌟 PREGUNTAR AL SERVIDOR SI EL PILOTO AUTOMÁTICO ESTÁ ENCENDIDO PARA ESTE CHAT
      socket.emit('check-autopilot', activeChat.id);
    }
  }, [activeChat?.id]); 

  // ⬇️ Auto-Scroll mágico al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, activeChat?.id]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    socket.emit('login-attempt', { username: usernameInput.trim(), password: passwordInput.trim() });
  };

  const handleLogout = () => {
    setAgentName(null); setAgentRole(null); setUsernameInput(""); setPasswordInput(""); setLoginError("");
    setCurrentView('chats');
    localStorage.removeItem("crm_agent_name"); localStorage.removeItem("crm_agent_role");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setAttachment({ file, base64: base64String, type: file.type.startsWith('image/') ? 'image' : 'document' });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || !activeChat) return;

    if (isNoteMode) {
        socket.emit("send-note", { to: activeChat.id, text: inputText, agentName }); 
        setMessages((prev) => [...prev, { id: 'note_'+Date.now(), from: "me", body: inputText, timestamp: new Date() as any, isMine: true, isNote: true, agentName }]);
        setIsNoteMode(false);
    } else {
        socket.emit("send-message", { 
            to: activeChat.id, text: inputText, agentName, 
            media: attachment ? { name: attachment.file.name, mimeType: attachment.file.type, data: attachment.base64 } : null
        });
    }
    setInputText(""); setAttachment(null); setShowSnippets(false);
  };

  const handleSendQuote = (cart: any, total: number | string | undefined) => {
    if (activeChat && socket) {
      // 🛡️ TRADUCTOR Y VALIDADOR DE CARRO DE COMPRAS BLINDADO
      let cartItems: any[] = [];
      if (Array.isArray(cart)) {
          cartItems = cart;
      } else if (typeof cart === 'object' && cart !== null) {
          cartItems = Array.isArray(cart.items) ? cart.items : Object.values(cart);
      }

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
          console.error("El carrito está vacío o tiene un formato incorrecto:", cart);
          alert("Error: El carrito está vacío. Por favor, selecciona al menos un producto.");
          return;
      }

      let baseMessageText = "📄 *COTIZACIÓN DE PRODUCTOS*\n_Electrodomésticos Jared_\n----------------------------\n\n";

      cartItems.forEach((item: any) => {
        if (item && typeof item === 'object') {
             const price = Number(item.price) || 0;
             const qty = Number(item.quantity) || 1;
             baseMessageText += `▪ ${qty}x *${item.name || 'Producto'}*\nP. Unit: S/ ${price.toFixed(2)} | Subtotal: *S/ ${(price * qty).toFixed(2)}*\n\n`;
        }
      });

      const safeTotal = Number(total) || 0;
      baseMessageText += `----------------------------\n💰 *TOTAL A PAGAR: S/ ${safeTotal.toFixed(2)}*\n\n`;

      // 🛡️ SOLUCIÓN: Solo le pedimos al servidor que cree la cotización, NO mandamos el mensaje aún.
      socket.emit("create-quote", {
        contactId: activeChat.id,
        items: cartItems, 
        total: safeTotal,
        text: baseMessageText
      });

      setIsCatalogModalOpen(false);
    }
  };

  const handleSaveNote = () => {
    if (!noteInput.trim() || !activeChat) return;
    socket.emit("send-note", { to: activeChat.id, text: noteInput, agentName }); 
    setMessages((prev) => [...prev, { id: 'note_'+Date.now(), from: "me", body: noteInput, timestamp: new Date() as any, isMine: true, isNote: true, agentName }]);
    setNoteInput("");
  };

  const handleLabelChange = (newLabel: string) => {
    if (!activeChat) return;
    const labelToSave = newLabel === "Sin etiqueta" ? null : newLabel;
    socket.emit("update-label", { chatId: activeChat.id, label: labelToSave });
    setActiveChat({ ...activeChat, label: labelToSave });
    setChats(chats.map(c => c.id === activeChat.id ? { ...c, label: labelToSave } : c));
  };

  const handleCRMChange = (field: keyof CRMData, value: string) => setCrmForm(prev => ({ ...prev, [field]: value }));
  const handleSaveCRM = () => {
    if (!activeChat) return;
    setIsSavingCRM(true);
    socket.emit('update-contact-info', { chatId: activeChat.id, ...crmForm });
    setActiveChat({ ...activeChat, crmData: crmForm });
    setChats(chats.map(c => c.id === activeChat.id ? { ...c, crmData: crmForm } : c));
    setTimeout(() => setIsSavingCRM(false), 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setInputText(val);
    if (val.startsWith("/") && !isNoteMode) setShowSnippets(true); else setShowSnippets(false);
  };

  const handleSelectSnippet = (text: string) => { setInputText(text); setShowSnippets(false); inputRef.current?.focus(); };
  
  const saveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.trim() || !newReplyText.trim()) return;
    const formattedShortcut = newShortcut.startsWith("/") ? newShortcut : `/${newShortcut}`;
    const updated = [...quickReplies, { shortcut: formattedShortcut.toLowerCase(), text: newReplyText }];
    setQuickReplies(updated); localStorage.setItem("crm_quick_replies", JSON.stringify(updated));
    setNewShortcut(""); setNewReplyText("");
  };

  const deleteSnippet = (shortcutToDelete: string) => {
    const updated = quickReplies.filter(s => s.shortcut !== shortcutToDelete);
    setQuickReplies(updated); localStorage.setItem("crm_quick_replies", JSON.stringify(updated));
  };

  const saveLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || customLabels.some(l => l.name.toLowerCase() === newLabelName.toLowerCase())) return;
    const updated = [...customLabels, { name: newLabelName.trim(), color: newLabelColor }];
    setCustomLabels(updated); localStorage.setItem("crm_custom_labels", JSON.stringify(updated));
    setNewLabelName("");
  };

  const deleteLabel = (nameToDelete: string) => {
    const updated = customLabels.filter(l => l.name !== nameToDelete);
    setCustomLabels(updated); localStorage.setItem("crm_custom_labels", JSON.stringify(updated));
    if (activeFilter === nameToDelete) setActiveFilter("Todas");
  };

  const getLabelColor = (labelName: string | null) => {
    if (!labelName) return "";
    const found = customLabels.find(l => l.name === labelName);
    return found ? `${found.color} border` : "bg-[#1a1d2d] text-slate-400 border-slate-700/50 border";
  };

  const pedirTranscripcion = (msg: Message) => {
      setIsTranscribing(prev => ({ ...prev, [msg.id]: true }));
      socket.emit('transcribe-audio', {
          messageId: msg.id,
          mediaUrl: msg.mediaUrl,
          mimeType: msg.mimeType
      });
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) || chat.id.includes(searchTerm);
    
    let matchesFilter = true;
    if (activeFilter === "Archivados") {
        matchesFilter = chat.label === "Archivado";
    } else if (activeFilter === "Todas") {
        matchesFilter = chat.label !== "Archivado";
    } else {
        matchesFilter = chat.label === activeFilter && chat.label !== "Archivado";
    }
    
    const matchesAgent = agentRole === 'admin' 
       ? true 
       : (chat.assignedTo === agentName || !chat.assignedTo);
       
    return matchesSearch && matchesFilter && matchesAgent;
  });

  const filteredSnippets = quickReplies.filter(s => s.shortcut.toLowerCase().includes(inputText.toLowerCase()));
  const internalNotes = messages.filter(m => m.isNote);

  if (!agentName) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b0e14] font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
        <div className="bg-[#131620] p-10 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center border border-white/5 z-10">
          <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-purple-900/20 border border-purple-500/30">
            <Lock className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">JARED<span className="text-slate-500">CRM</span></h1>
          <p className="text-sm text-slate-400 mb-8 text-center">Ingresa tus credenciales de acceso.</p>
          
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Usuario</label>
              <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="Ej: Joshua" className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold text-white focus:bg-[#1a1d2d] focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600" required />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••" className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold text-white focus:bg-[#1a1d2d] focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-slate-600" required />
            </div>
            
            {loginError && <p className="text-xs text-rose-400 font-bold text-center mt-1">{loginError}</p>}

            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-purple-900/30">
              <LogIn className="w-5 h-5"/> Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-300 font-sans relative overflow-hidden">
      
      {enlargedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setEnlargedImage(null)}>
          <button onClick={() => setEnlargedImage(null)} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"><X className="w-6 h-6" /></button>
          <img src={enlargedImage} alt="Imagen ampliada" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {isRepliesModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131620] border border-white/5 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#0b0e14] border-b border-white/5 text-white flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500"/> Respuestas Rápidas</h2><button onClick={() => setIsRepliesModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5"/></button></div>
            <div className="p-6 bg-[#131620] border-b border-white/5">
              <form onSubmit={saveSnippet} className="flex flex-col gap-3">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Atajo</label><input type="text" value={newShortcut} onChange={e => setNewShortcut(e.target.value)} placeholder="/atajo" className="w-full mt-1 p-2 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none" required /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Mensaje</label><textarea value={newReplyText} onChange={e => setNewReplyText(e.target.value)} placeholder="Mensaje..." className="w-full mt-1 p-2 bg-[#0b0e14] border border-white/5 rounded-lg text-sm h-20 resize-none text-white focus:ring-1 focus:ring-purple-500 outline-none" required /></div>
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2"><Plus className="w-4 h-4"/> Agregar Respuesta</button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {quickReplies.map((reply, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-[#0b0e14] border border-white/5 rounded-lg shadow-sm">
                  <div><span className="font-bold text-sm text-purple-400 block">{reply.shortcut}</span><span className="text-xs text-slate-400 mt-1 line-clamp-2">{reply.text}</span></div>
                  <button onClick={() => deleteSnippet(reply.shortcut)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-white/5 rounded-lg ml-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLabelsModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131620] border border-white/5 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-[#0b0e14] border-b border-white/5 text-white flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><Tag className="w-5 h-5 text-emerald-500"/> Gestor de Etiquetas</h2><button onClick={() => setIsLabelsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-5 h-5"/></button></div>
            <div className="p-6 bg-[#131620] border-b border-white/5">
              <form onSubmit={saveLabel} className="flex flex-col gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Nombre</label><input type="text" value={newLabelName} onChange={e => setNewLabelName(e.target.value)} className="w-full mt-1 p-2 bg-[#0b0e14] border border-white/5 rounded-lg text-sm text-white outline-none focus:ring-1 focus:ring-purple-500" required /></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-2">Color</label><div className="flex flex-wrap gap-2">{COLOR_OPTIONS.map((color, idx) => (<button key={idx} type="button" onClick={() => setNewLabelColor(color.class)} className={`w-8 h-8 rounded-full border border-white/10 transition-all ${color.class.split(' ')[0]} ${newLabelColor === color.class ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#131620]' : 'hover:opacity-80'}`} />))}</div></div>
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 mt-2"><Plus className="w-4 h-4"/> Crear</button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {customLabels.map((lbl, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-[#0b0e14] border border-white/5 rounded-lg shadow-sm">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${lbl.color} border`}>{lbl.name}</span>
                  <button onClick={() => deleteLabel(lbl.name)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CatalogModal 
        isOpen={isCatalogModalOpen} 
        onClose={() => setIsCatalogModalOpen(false)} 
        onSendQuote={handleSendQuote} 
        socket={socket} 
      />

      <nav className={`bg-[#131620] flex flex-col py-6 border-r border-white/5 shadow-xl z-20 flex-shrink-0 transition-all duration-300 relative ${isNavCollapsed ? 'w-20 items-center' : 'w-64'}`}>
         
         <button 
           onClick={() => setIsNavCollapsed(!isNavCollapsed)} 
           className="absolute -right-3 top-8 bg-purple-600 rounded-full p-1 text-white shadow-lg hover:bg-purple-500 transition-colors z-50"
         >
           {isNavCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
         </button>

         <div className={`px-6 flex items-center gap-3 mb-10 ${isNavCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex-shrink-0">
                {agentName.substring(0,2).toUpperCase()}
            </div>
            {!isNavCollapsed && <h1 className="text-xl font-black text-white tracking-tight truncate">JARED<span className="text-slate-500 font-medium">CRM</span></h1>}
         </div>

         <div className={`mb-3 ${isNavCollapsed ? 'px-0 text-center' : 'px-6'}`}>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isNavCollapsed ? '---' : 'Menú Principal'}</p>
         </div>

         <div className={`flex flex-col gap-1 w-full ${isNavCollapsed ? 'px-2' : 'px-4'}`}>
             
             <button onClick={() => setCurrentView('kanban')} className={`w-full py-3 rounded-xl flex items-center transition-all ${isNavCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${currentView === 'kanban' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`} title="Embudo de Ventas">
                <Kanban className="w-5 h-5 flex-shrink-0" />
                {!isNavCollapsed && <span className="text-sm font-semibold truncate">Embudo de Ventas</span>}
             </button>

             <button onClick={() => setCurrentView('agenda')} className={`w-full py-3 rounded-xl flex items-center transition-all ${isNavCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${currentView === 'agenda' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`} title="Agenda y Follow-ups">
                <CalendarDays className="w-5 h-5 flex-shrink-0" />
                {!isNavCollapsed && <span className="text-sm font-semibold truncate">Agenda y Tareas</span>}
             </button>

             <button onClick={() => setCurrentView('chats')} className={`w-full py-3 rounded-xl flex items-center justify-between transition-all ${isNavCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${currentView === 'chats' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`} title="Mensajes (Chat)">
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 flex-shrink-0" />
                    {!isNavCollapsed && <span className="text-sm font-semibold truncate">Mensajes (Chat)</span>}
                </div>
                {!isNavCollapsed && messages.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 flex-shrink-0"></span>}
             </button>
         </div>

         {agentRole === 'admin' && (
             <>
                <div className={`mt-8 mb-3 ${isNavCollapsed ? 'px-0 text-center' : 'px-6'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isNavCollapsed ? '---' : 'Soporte'}</p>
                </div>
                <div className={`flex flex-col gap-1 w-full ${isNavCollapsed ? 'px-2' : 'px-4'}`}>
                     <button onClick={() => setCurrentView('stats')} className={`w-full py-3 rounded-xl flex items-center transition-all ${isNavCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${currentView === 'stats' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`} title="Vista General">
                        <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                        {!isNavCollapsed && <span className="text-sm font-semibold truncate">Vista General</span>}
                     </button>
                    <button onClick={() => setCurrentView('admin')} className={`w-full py-3 rounded-xl flex items-center transition-all ${isNavCollapsed ? 'justify-center px-0' : 'px-4 gap-3'} ${currentView === 'admin' ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`} title="Ajustes / Equipo">
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!isNavCollapsed && <span className="text-sm font-semibold truncate">Ajustes / Equipo</span>}
                    </button>
                </div>
             </>
         )}

         <div className={`mt-auto ${isNavCollapsed ? 'px-2' : 'px-6'}`}>
             <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors p-3 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/5`} title="Cerrar Sesión">
                <LogOut className="w-4 h-4 flex-shrink-0" /> 
                {!isNavCollapsed && <span className="text-sm font-semibold truncate">Cerrar Sesión</span>}
             </button>
         </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
          
          {currentView === 'chats' && (
              <>
                  <Sidebar 
                    isConnected={isConnected} filteredChats={filteredChats} activeChat={activeChat} setActiveChat={setActiveChat}
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeFilter={activeFilter} setActiveFilter={setActiveFilter}
                    customLabels={customLabels} getLabelColor={getLabelColor} setIsLabelsModalOpen={setIsLabelsModalOpen} setIsRepliesModalOpen={setIsRepliesModalOpen}
                  />
                  
                  <ChatPanel 
                    activeChat={activeChat}
                    isConnected={isConnected}
                    messages={messages}
                    loadingPercent={loadingPercent}
                    loadingMessage={loadingMessage}
                    isAutoPilotActive={isAutoPilotActive}
                    setIsAutoPilotActive={setIsAutoPilotActive}
                    isAISummarizing={isAISummarizing}
                    setIsAISummarizing={setIsAISummarizing}
                    setShowContactInfo={setShowContactInfo}
                    showContactInfo={showContactInfo}
                    getLabelColor={getLabelColor}
                    enlargedImage={enlargedImage}
                    setEnlargedImage={setEnlargedImage}
                    pedirTranscripcion={pedirTranscripcion}
                    isTranscribing={isTranscribing}
                    transcriptions={transcriptions}
                    messagesEndRef={messagesEndRef}
                    attachment={attachment}
                    setAttachment={setAttachment}
                    showSnippets={showSnippets}
                    filteredSnippets={filteredSnippets}
                    handleSelectSnippet={handleSelectSnippet}
                    handleSendMessage={handleSendMessage}
                    fileInputRef={fileInputRef}
                    handleFileChange={handleFileChange}
                    isNoteMode={isNoteMode}
                    setIsNoteMode={setIsNoteMode}
                    isAIGenerating={isAIGenerating}
                    setIsAIGenerating={setIsAIGenerating}
                    setIsCatalogModalOpen={setIsCatalogModalOpen}
                    inputRef={inputRef}
                    inputText={inputText}
                    handleInputChange={handleInputChange}
                    socket={socket}
                    setChats={setChats}
                    chats={chats}
                    setActiveChat={setActiveChat}
                    agentName={agentName}
                  />
                  
                  {showContactInfo && activeChat && (
                    <RightPanel 
                      activeChat={activeChat} setShowContactInfo={setShowContactInfo} handleLabelChange={handleLabelChange} customLabels={customLabels}
                      crmForm={crmForm} handleCRMChange={handleCRMChange} handleSaveCRM={handleSaveCRM} isSavingCRM={isSavingCRM}
                      noteInput={noteInput} setNoteInput={setNoteInput} handleSaveNote={handleSaveNote} internalNotes={internalNotes} getLabelColor={getLabelColor}
                      socket={socket} agentName={agentName || "Asesor"}
                    />
                  )}
              </>
          )}

          {currentView === 'kanban' && (
              <div className="flex-1 flex flex-col bg-[#0b0e14]">
                  <KanbanBoard 
                    chats={chats} customLabels={customLabels} getLabelColor={getLabelColor}
                    handleLabelChange={(chatId, newLabel) => {
                      const labelToSave = newLabel === "Sin etiqueta" ? null : newLabel;
                      socket.emit("update-label", { chatId: chatId, label: labelToSave });
                      setChats(chats.map(c => c.id === chatId ? { ...c, label: labelToSave } : c));
                      if (activeChat?.id === chatId) setActiveChat({ ...activeChat, label: labelToSave });
                    }} 
                  />
              </div>
          )}

          {currentView === 'agenda' && (
              <div className="flex-1 w-full bg-[#0b0e14] relative">
                  <AgendaPanel isOpen={true} socket={socket} agentName={agentName || ""} chats={chats} />
              </div>
          )}

          {currentView === 'stats' && agentRole === 'admin' && (
              <div className="flex-1 w-full bg-[#0b0e14] relative">
                  <StatsPanel isOpen={true} onClose={() => setCurrentView('chats')} socket={socket} />
              </div>
          )}

          {currentView === 'admin' && agentRole === 'admin' && (
              <div className="flex-1 w-full bg-[#0b0e14] relative">
                  <AdminPanel isOpen={true} onClose={() => setCurrentView('chats')} agentName={agentName || ""} socket={socket} />
              </div>
          )}

      </div>
    </div>
  );
}