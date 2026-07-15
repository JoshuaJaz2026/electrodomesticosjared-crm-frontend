import { useState, useEffect, useRef } from "react";
import { Shield, Plus, Trash2, Users, Settings, Package, Image as ImageIcon, UploadCloud, Bot, MessageSquare, Save, Smartphone, X } from "lucide-react";
import QRCode from "react-qr-code";
import { AppUser } from "../types";

type Product = {
  id: number;
  name: string;
  brand?: string;
  cost_price?: number;
  price: number;
  stock: number;
  category: string;
  image: string;
};

type BotSettings = {
  greeting_menu: string;
  opt1_reply: string;
  opt2_reply: string;
  opt3_reply: string;
  opt4_reply: string;
};

type AdminPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentRole: string; // 🛡️ EL CANDADO: Requerimos saber el rol
  socket: any;
};

export default function AdminPanel({ isOpen, onClose, agentName, agentRole, socket }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('conexiones');
  
  // Estados para Usuarios
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // 🚨 CORRECCIÓN: El valor inicial debe coincidir con el backend (Agente)
  const [newUserRole, setNewUserRole] = useState("Agente"); 
  const [userError, setUserError] = useState("");
  
  // Estados para Inventario (Avanzado)
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductCost, setNewProductCost] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Licuadoras");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Estados para el Chatbot
  const [botSettings, setBotSettings] = useState<BotSettings>({
    greeting_menu: "", opt1_reply: "", opt2_reply: "", opt3_reply: "", opt4_reply: ""
  });
  const [isSavingBot, setIsSavingBot] = useState(false);

  // Estados Monolíticos para la Conexión Única
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isBotConnected, setIsBotConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isPairingLocked, setIsPairingLocked] = useState(false);
  const [pairingError, setPairingError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    
    // 🛡️ Seguridad extra: Solo cargar usuarios si es superadmin
    if (agentRole === 'superadmin') {
        socket.emit('get-users');
    }

    socket.emit('get-products');
    socket.emit('get-bot-settings');
    socket.emit('check-status');

    const handleLoadUsers = (users: AppUser[]) => setAppUsers(users);
    const handleUserError = (msg: string) => setUserError(msg);
    const handleLoadProducts = (data: Product[]) => setProducts(data);
    const handleLoadBotSettings = (data: BotSettings) => { if(data) setBotSettings(data); };

    socket.on('load-users', handleLoadUsers);
    socket.on('user-error', handleUserError);
    socket.on('load-products', handleLoadProducts);
    socket.on('load-bot-settings', handleLoadBotSettings);

    // ESCUCHADORES DE CONEXIÓN
    socket.on('whatsapp-qr', (qr: string) => {
    if (!isPairingLocked) {
        setQrCode(qr);
        setIsBotConnected(false);
        setPairingCode(null);
        setIsRequestingCode(false);
    }
});
    
    socket.on('pairing-code-success', (data: { code: string }) => {
        setPairingCode(data.code);
        setIsRequestingCode(false);
    });

    socket.on('pairing-error', (msg: string) => {
        setPairingError(msg);
        setIsRequestingCode(false);
    });

    socket.on('whatsapp-ready', () => {
        setIsBotConnected(true);
        setQrCode(null);
        setPairingCode(null);
    });

    socket.on('whatsapp-disconnected', () => {
        setIsBotConnected(false);
        setQrCode(null);
    });

    return () => {
      socket.off('load-users', handleLoadUsers);
      socket.off('user-error', handleUserError);
      socket.off('load-products', handleLoadProducts);
      socket.off('load-bot-settings', handleLoadBotSettings);
      socket.off('whatsapp-qr');
      socket.off('pairing-code-success');
      socket.off('pairing-error');
      socket.off('whatsapp-ready');
      socket.off('whatsapp-disconnected');
    };
  }, [isOpen, socket, agentRole]);

  // Funciones de Usuarios
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    socket.emit('create-user', { username: newUsername.trim(), password: newPassword, role: newUserRole });
    setNewUsername(""); setNewPassword(""); setUserError("");
  };

  const handleDeleteUser = (id: number, username: string) => {
    if (confirm(`¿Seguro que deseas eliminar permanentemente a ${username}?`)) {
      socket.emit('delete-user', id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no debe pesar más de 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageBase64(base64String);
      setImagePreview(base64String); 
    };
    reader.readAsDataURL(file);
  };

  // Funciones de Productos
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !imageBase64) {
        alert("Completa al menos el nombre, el precio de venta y sube una imagen.");
        return;
    }
    
    socket.emit('add-product', {
      name: newProductName, 
      brand: newProductBrand || "Genérico",
      costPrice: Number(newProductCost) || 0,
      price: parseFloat(newProductPrice),
      stock: parseInt(newProductStock) || 0, 
      category: newProductCategory, 
      image: imageBase64 
    });

    setNewProductName(""); setNewProductBrand(""); setNewProductCost(""); setNewProductPrice(""); 
    setNewProductStock(""); setImageBase64(""); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`¿Seguro que deseas eliminar el producto: ${name}?`)) socket.emit('delete-product', id);
  };

  const handleSaveBotSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBot(true);
    socket.emit('update-bot-settings', botSettings);
    setTimeout(() => setIsSavingBot(false), 800);
  };

  const handleRequestPairingCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return alert("Ingresa un número válido");
    setIsRequestingCode(true);
    setIsPairingLocked(true); 
    setPairingError("");
    socket.emit('request-pairing-code', { phoneNumber });
  };

  const expectedProfit = (Number(newProductPrice) || 0) - (Number(newProductCost) || 0);

  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f111a] overflow-hidden animate-in fade-in duration-300">
        
      {/* HEADER */}
      <header className="p-6 bg-[#131620] border-b border-white/5 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-500"/> Ajustes y Administración
          </h2>
          <p className="text-sm text-slate-400 mt-1">Administra tu equipo, inventario, asistente virtual y conexiones.</p>
        </div>
        
        <div className="flex gap-1 bg-[#0b0e14] p-1 rounded-xl border border-white/5">
             <button onClick={() => setActiveTab('conexiones')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'conexiones' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Smartphone className="w-4 h-4"/> Conexiones</button>
             
             {/* 🛡️ PESTAÑA OCULTA: SOLO VISIBLE PARA SUPERADMIN */}
             {agentRole === 'superadmin' && (
                 <button onClick={() => setActiveTab('usuarios')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'usuarios' ? 'bg-[#1a1d2d] shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Users className="w-4 h-4"/> Asesores</button>
             )}

             <button onClick={() => setActiveTab('inventario')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inventario' ? 'bg-purple-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Package className="w-4 h-4"/> Inventario</button>
             <button onClick={() => setActiveTab('chatbot')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chatbot' ? 'bg-emerald-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Bot className="w-4 h-4"/> Chatbot</button>
             <button onClick={() => setActiveTab('seguridad')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'seguridad' ? 'bg-[#1a1d2d] shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Settings className="w-4 h-4"/> Seguridad</button>
        </div>
      </header>
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-8">
          
          {/* PESTAÑA: CONEXIONES */}
          {activeTab === 'conexiones' && (
              <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Conexión de WhatsApp</h3>
                      <p className="text-sm text-slate-400">Vincula o desconecta el número de teléfono de tu empresa.</p>
                  </div>

                  {isBotConnected ? (
                      <div className="bg-[#131620] border border-white/5 rounded-2xl overflow-hidden">
                          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0b0e14]">
                              <h4 className="font-bold text-white flex items-center gap-2">
                                  <Smartphone className="w-5 h-5 text-emerald-500" /> Línea Principal
                              </h4>
                          </div>
                          <div className="p-6 flex flex-col gap-4">
                              <div className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                          <Smartphone className="w-6 h-6 text-emerald-500" />
                                      </div>
                                      <div>
                                          <p className="text-white font-bold text-lg">WhatsApp Empresa</p>
                                          <p className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 mt-1">
                                              <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                              </span>
                                              Conectado y Operativo
                                          </p>
                                      </div>
                                  </div>
                                  <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-sm font-bold transition-colors">
                                      Desconectar
                                  </button>
                              </div>
                          </div>
                      </div>
                  ) : pairingCode ? (
                      <div className="bg-[#131620] border border-blue-500/30 shadow-xl shadow-blue-900/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-6 text-center animate-in zoom-in-95 duration-300">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-2">
                              <Smartphone className="w-8 h-8 text-blue-400 animate-pulse" />
                          </div>
                          <div>
                              <h4 className="text-2xl font-bold text-white mb-2">Código de Vinculación</h4>
                              <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                                  En tu celular, abre WhatsApp {'>'} Dispositivos vinculados {'>'} Vincular con el número de teléfono. Escribe el siguiente código:
                              </p>
                          </div>
                          <div className="text-4xl sm:text-5xl font-black text-blue-400 tracking-[0.3em] bg-[#0b0e14] py-6 px-10 rounded-2xl border border-blue-500/30 shadow-inner">
                              {pairingCode}
                          </div>
                          <p className="text-xs text-slate-500 mt-4">Esperando autenticación de WhatsApp...</p>
                      </div>
                  ) : qrCode ? (
                      <div className="bg-[#131620] border border-blue-500/30 shadow-xl shadow-blue-900/10 rounded-2xl p-10 flex flex-col lg:flex-row items-center justify-center gap-10 text-center lg:text-left">
                          <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                                  <Smartphone className="w-6 h-6 text-blue-400 animate-pulse" />
                              </div>
                              <h4 className="text-lg font-bold text-white mb-2">Opción 1: Escanear QR</h4>
                              <p className="text-xs text-slate-400 max-w-[200px] text-center mb-4">Abre WhatsApp en tu celular y escanea este código.</p>
                              <div className="bg-white p-4 rounded-xl shadow-xl">
                                  <QRCode value={qrCode} size={180} />
                              </div>
                          </div>

                          <div className="hidden lg:flex w-px h-64 bg-white/10"></div>
                          <div className="flex lg:hidden h-px w-full bg-white/10 my-2"></div>

                          <div className="flex flex-col items-center lg:items-start w-full max-w-sm">
                              <h4 className="text-lg font-bold text-white mb-2">Opción 2: Usar Código</h4>
                              <p className="text-slate-400 text-xs mb-6 text-center lg:text-left">Si la cámara te da problemas, ingresa el número de WhatsApp de tu empresa (incluye código de país).</p>
                              
                              <form onSubmit={handleRequestPairingCode} className="w-full flex flex-col gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Número de Teléfono</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 51987654321" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 text-white transition-all"
                                    />
                                  </div>
                                  {pairingError && <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg text-center border border-rose-500/20">{pairingError}</p>}
                                  
                                  <button 
                                      type="submit" 
                                      disabled={isRequestingCode || !phoneNumber}
                                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
                                  >
                                      {isRequestingCode ? 'Solicitando...' : 'Generar Código (8 dígitos)'}
                                  </button>
                              </form>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-8 text-slate-500 text-sm bg-[#0b0e14] rounded-xl border border-white/5 animate-pulse">
                          Esperando conexión con el servidor de WhatsApp...
                      </div>
                  )}
              </div>
          )}

          {/* 🛡️ PESTAÑA: USUARIOS (CONTENIDO SOLO PARA SUPERADMIN) */}
          {activeTab === 'usuarios' && agentRole === 'superadmin' && (
              <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                  <div className="bg-[#131620] p-8 border border-white/5 rounded-2xl shadow-sm lg:w-1/3 flex-shrink-0 h-fit">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-purple-500"/> Agregar Usuario</h3>
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-5">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre</label>
                          <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Ej: Carlos" className="w-full mt-2 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all" required />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contraseña</label>
                          <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full mt-2 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all" required />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Rol</label>
                          <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full mt-2 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all cursor-pointer">
                              {/* 🚨 CORRECCIÓN: Opciones exactas alineadas con tu arquitectura */}
                              <option value="Agente">Asesor Estándar (Atiende chats)</option>
                              <option value="admin">Administrador (El Jefe)</option>
                              <option value="superadmin">Superadmin (Dios del Sistema)</option>
                          </select>
                      </div>
                      {userError && <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-center">{userError}</p>}
                      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 mt-2 transition-all shadow-lg shadow-purple-900/20">
                          Crear Usuario
                      </button>
                    </form>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500"/> Personal Activo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {appUsers.length === 0 ? (
                            <p className="text-sm text-slate-500 col-span-2 p-6 bg-[#131620] border border-dashed border-white/10 rounded-2xl text-center">Cargando usuarios...</p>
                        ) : (
                            appUsers.map((u) => (
                                <div key={u.id} className="bg-[#131620] p-5 border border-white/5 rounded-2xl shadow-sm hover:border-purple-500/30 transition-colors flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-inner ${u.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                                            {u.username.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-white leading-tight">{u.username}</p>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'text-purple-400' : 'text-emerald-400'}`}>{u.role}</span>
                                        </div>
                                    </div>
                                    {u.username !== agentName && (
                                        <button onClick={() => handleDeleteUser(u.id, u.username)} className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors opacity-0 group-hover:opacity-100" title="Revocar Acceso">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                  </div>
              </div>
          )}

          {/* PESTAÑA: INVENTARIO */}
          {activeTab === 'inventario' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Formulario para agregar productos */}
              <div className="lg:col-span-1 bg-[#131620] p-6 rounded-2xl border border-white/5 shadow-xl h-fit">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-purple-500"/> Nuevo Producto</h3>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Producto</label>
                    <input type="text" value={newProductName} onChange={e=>setNewProductName(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-600" placeholder="Ej: Licuadora Clásica" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marca</label>
                      <input type="text" value={newProductBrand} onChange={e=>setNewProductBrand(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-600" placeholder="Ej: Oster" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
                      <select value={newProductCategory} onChange={e=>setNewProductCategory(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none">
                        <option value="Licuadoras">Licuadoras</option>
                        <option value="Televisores">Televisores</option>
                        <option value="Refrigeradoras">Refrigeradoras</option>
                        <option value="Cocinas">Cocinas</option>
                        <option value="Lavadoras">Lavadoras</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo (S/)</label>
                      <input type="number" step="0.01" value={newProductCost} onChange={e=>setNewProductCost(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-600" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio Venta (S/)</label>
                      <input type="number" step="0.01" value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-emerald-500/30 rounded-xl text-sm text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-emerald-900" placeholder="0.00" required />
                    </div>
                  </div>

                  {/* Mostrar la ganancia estimada */}
                  {newProductCost && newProductPrice && (
                    <div className={`p-3 rounded-xl border flex justify-between items-center ${expectedProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      <span className="text-xs font-bold uppercase tracking-wider">Ganancia Estimada:</span>
                      <span className="font-black">S/ {expectedProfit.toFixed(2)}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Inicial</label>
                    <input type="number" value={newProductStock} onChange={e=>setNewProductStock(e.target.value)} className="w-full mt-1 p-3 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none placeholder:text-slate-600" placeholder="Ej: 10" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Foto del Producto</label>
                    <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-purple-500 hover:bg-purple-500/5 transition-all group">
                      {imagePreview ? (
                        <div className="relative w-full h-full p-2">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                            <span className="text-xs font-bold text-white">Cambiar Foto</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <span className="text-sm font-bold">Haz clic para subir foto</span>
                          <span className="text-xs opacity-50 mt-1">PNG, JPG o WEBP</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 mt-4">
                    <Plus className="w-5 h-5"/> Guardar en Inventario
                  </button>
                </form>
              </div>

              {/* LISTA/TABLA DE CATÁLOGO (CON PAGINACIÓN) */}
              <div className="lg:col-span-2 bg-[#131620] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                <div className="p-6 border-b border-white/5 bg-[#0b0e14] flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-purple-500"/> Catálogo Actual</h3>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">{products.length} Productos Totales</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-500 h-full">
                      <Package className="w-16 h-16 mb-4 opacity-20" />
                      <p>Tu catálogo está vacío.</p>
                      <p className="text-sm">Agrega productos en el panel izquierdo para comenzar a cotizar.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 flex-1">
                        {products
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((product) => {
                          const profit = Number(product.price) - Number(product.cost_price || 0);
                          return (
                            <div key={product.id} className="bg-[#0b0e14] rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors group relative overflow-hidden flex items-center p-3 gap-4">
                              
                              <button onClick={() => handleDeleteProduct(product.id, product.name)} className="absolute top-1/2 -translate-y-1/2 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 p-2 rounded-lg z-10 bg-[#0b0e14]">
                                <Trash2 className="w-5 h-5" />
                              </button>
                              
                              {/* Imagen Horizontal */}
                              <div className="h-16 w-16 bg-white/5 flex items-center justify-center rounded-lg border border-white/10 p-1 flex-shrink-0">
                                {product.image && product.image.length > 10 ? (
                                  <img src={product.image.startsWith('data:image') ? product.image : `data:image/jpeg;base64,${product.image}`} alt={product.name} className="w-full h-full object-cover rounded" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-600" />
                                )}
                              </div>

                              {/* Datos del Producto */}
                              <div className="flex-1 min-w-0 pr-12">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest px-2 py-0.5 bg-purple-500/10 rounded">
                                      {product.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                      {product.brand || "GENÉRICO"}
                                  </span>
                                </div>
                                <h4 className="font-bold text-white text-sm truncate" title={product.name}>{product.name}</h4>
                                
                                <div className="flex items-center gap-6 mt-1">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-slate-500 uppercase font-bold">Costo:</span>
                                     <span className="text-xs font-medium text-slate-300">S/ {Number(product.cost_price || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-emerald-500/70 uppercase font-bold">Utilidad:</span>
                                     <span className="text-xs font-bold text-emerald-500">S/ {profit.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Columna Derecha (Precio y Stock) */}
                              <div className="flex flex-col items-end flex-shrink-0 pr-2 border-l border-white/5 pl-4">
                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Precio Público</p>
                                <p className="text-lg font-black text-emerald-400 mb-1">S/ {Number(product.price).toLocaleString()}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${product.stock > 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                  Stock: {product.stock > 0 ? product.stock : '0'}
                                </span>
                              </div>

                            </div>
                          )
                        })}

                        {/* Controles de Paginación */}
                        {products.length > itemsPerPage && (
                          <div className="mt-auto pt-4 flex justify-between items-center border-t border-white/5">
                            <span className="text-xs text-slate-500 font-medium">
                              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, products.length)} de {products.length}
                            </span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors border border-white/5"
                              >
                                Anterior
                              </button>
                              <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(products.length / itemsPerPage), p + 1))}
                                disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors border border-white/5"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: CHATBOT */}
          {activeTab === 'chatbot' && (
              <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
                  <div className="bg-[#131620] p-8 border border-white/5 rounded-2xl shadow-sm w-full h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-white flex items-center gap-2"><Bot className="w-5 h-5 text-emerald-500"/> Configuración de Respuestas Automáticas</h3>
                        <p className="text-xs text-slate-400">Edita los textos que el bot envía automáticamente a los clientes.</p>
                    </div>

                    <form onSubmit={handleSaveBotSettings} className="flex flex-col gap-6">
                      <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                             <MessageSquare className="w-3 h-3 text-emerald-500"/> Saludo Principal (Menú)
                          </label>
                          <textarea 
                            value={botSettings.greeting_menu} 
                            onChange={e => setBotSettings({...botSettings, greeting_menu: e.target.value})} 
                            className="w-full h-32 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                            required 
                          />
                          <p className="text-[10px] text-slate-500 mt-2">Este mensaje debe contener las 4 opciones numéricas para que el flujo funcione correctamente.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-purple-400">Respuesta a Opción 1 (Ventas)</label>
                              <textarea 
                                value={botSettings.opt1_reply} 
                                onChange={e => setBotSettings({...botSettings, opt1_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-blue-400">Respuesta a Opción 2 (Soporte)</label>
                              <textarea 
                                value={botSettings.opt2_reply} 
                                onChange={e => setBotSettings({...botSettings, opt2_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-amber-400">Respuesta a Opción 3 (Envíos)</label>
                              <textarea 
                                value={botSettings.opt3_reply} 
                                onChange={e => setBotSettings({...botSettings, opt3_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-emerald-400">Respuesta a Opción 4 (Asesor)</label>
                              <textarea 
                                value={botSettings.opt4_reply} 
                                onChange={e => setBotSettings({...botSettings, opt4_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>
                      </div>
                      
                      <button type="submit" disabled={isSavingBot} className="w-full md:w-auto self-end bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 px-8 rounded-xl text-sm font-bold flex justify-center items-center gap-2 mt-2 transition-all shadow-lg shadow-emerald-900/20">
                          <Save className="w-4 h-4"/> {isSavingBot ? 'Guardando...' : 'Guardar Textos del Bot'}
                      </button>
                    </form>
                  </div>
              </div>
          )}

          {/* PESTAÑA: SEGURIDAD */}
          {activeTab === 'seguridad' && (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-[#131620]">
                  <Settings className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-slate-500 font-medium">Ajustes de seguridad del sistema próximamente...</p>
              </div>
          )}
      </div>
    </div>
  );
}