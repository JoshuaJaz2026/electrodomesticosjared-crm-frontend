import { useState, useEffect, useRef } from "react";
import { Shield, Plus, Trash2, Users, Settings, Package, Image as ImageIcon, UploadCloud, Bot, MessageSquare, Save, Smartphone, X } from "lucide-react";
import QRCode from "react-qr-code";
import { AppUser } from "../types";

type Product = {
  id: number;
  name: string;
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
  socket: any;
};

export default function AdminPanel({ isOpen, onClose, agentName, socket }: AdminPanelProps) {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estados para Usuarios
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("asesor");
  const [userError, setUserError] = useState("");
  
  // Estados para Productos
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Televisores");
  
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el Chatbot
  const [botSettings, setBotSettings] = useState<BotSettings>({
    greeting_menu: "", opt1_reply: "", opt2_reply: "", opt3_reply: "", opt4_reply: ""
  });
  const [isSavingBot, setIsSavingBot] = useState(false);

  // 🌟 NUEVO: Estados para Multi-Sesión (WhatsApp)
  const [sessions, setSessions] = useState<string[]>([]);
  const [qrData, setQrData] = useState<{sessionId: string, qr: string} | null>(null);

  // Iniciar en la pestaña de conexiones por defecto para ver el QR
  const [activeTab, setActiveTab] = useState('conexiones');

  useEffect(() => {
    if (!isOpen) return;
    
    socket.emit('get-users');
    socket.emit('get-products');
    socket.emit('get-bot-settings');
    socket.emit('get-sessions'); // Pedimos las sesiones activas

    const handleLoadUsers = (users: AppUser[]) => setAppUsers(users);
    const handleUserError = (msg: string) => setUserError(msg);
    const handleLoadProducts = (data: Product[]) => setProducts(data);
    const handleLoadBotSettings = (data: BotSettings) => setBotSettings(data);
    const handleLoadSessions = (data: string[]) => setSessions(data);

    socket.on('load-users', handleLoadUsers);
    socket.on('user-error', handleUserError);
    socket.on('load-products', handleLoadProducts);
    socket.on('load-bot-settings', handleLoadBotSettings);
    socket.on('load-sessions', handleLoadSessions);

    // 🌟 ESCUCHADORES DEL QR Y CONEXIONES
    socket.on('qr', (data: any) => setQrData(data));
    socket.on('session-ready', (data: any) => {
        setQrData(null);
        setSessions(prev => [...new Set([...prev, data.sessionId])]);
    });
    socket.on('session-disconnected', (data: any) => {
        setSessions(prev => prev.filter(s => s !== data.sessionId));
    });

    return () => {
      socket.off('load-users', handleLoadUsers);
      socket.off('user-error', handleUserError);
      socket.off('load-products', handleLoadProducts);
      socket.off('load-bot-settings', handleLoadBotSettings);
      socket.off('load-sessions', handleLoadSessions);
      socket.off('qr');
      socket.off('session-ready');
      socket.off('session-disconnected');
    };
  }, [isOpen, socket]);

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
    if (!newProductName || !newProductPrice || !newProductStock || !imageBase64) {
        alert("Completa todos los campos y sube una imagen.");
        return;
    }
    
    socket.emit('add-product', {
      name: newProductName, price: parseFloat(newProductPrice),
      stock: parseInt(newProductStock), category: newProductCategory, image: imageBase64 
    });

    setNewProductName(""); setNewProductPrice(""); setNewProductStock(""); 
    setImageBase64(""); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`¿Seguro que deseas eliminar el producto: ${name}?`)) socket.emit('delete-product', id);
  };

  // Función para guardar configuración del Chatbot
  const handleSaveBotSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBot(true);
    socket.emit('update-bot-settings', botSettings);
    setTimeout(() => setIsSavingBot(false), 800);
  };

  if (!isOpen) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f111a] overflow-hidden animate-in fade-in duration-300">
        
      <header className="p-6 bg-[#131620] border-b border-white/5 flex justify-between items-center z-10 flex-shrink-0">
        <div>
          <h2 className="font-bold text-2xl text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-500"/> Ajustes y Administración
          </h2>
          <p className="text-sm text-slate-400 mt-1">Administra los usuarios, permisos, conexiones e inventario.</p>
        </div>
        
        <div className="flex gap-1 bg-[#0b0e14] p-1 rounded-xl border border-white/5">
             {/* 🌟 NUEVO BOTÓN DE CONEXIONES */}
             <button onClick={() => setActiveTab('conexiones')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'conexiones' ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Smartphone className="w-4 h-4"/> Conexiones</button>
             <button onClick={() => setActiveTab('usuarios')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'usuarios' ? 'bg-[#1a1d2d] shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}>Asesores</button>
             <button onClick={() => setActiveTab('inventario')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inventario' ? 'bg-purple-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Package className="w-4 h-4"/> Inventario</button>
             <button onClick={() => setActiveTab('chatbot')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'chatbot' ? 'bg-emerald-600 shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}><Bot className="w-4 h-4"/> Chatbot</button>
             <button onClick={() => setActiveTab('seguridad')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'seguridad' ? 'bg-[#1a1d2d] shadow-sm text-white' : 'text-slate-500 hover:text-white'}`}>Seguridad</button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
          
          {/* 🌟 PESTAÑA: CONEXIONES */}
          {activeTab === 'conexiones' && (
              <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                  <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-2">Conexiones de WhatsApp</h3>
                      <p className="text-sm text-slate-400">Vincula o desconecta los números de teléfono de tu empresa.</p>
                  </div>

                  {qrData ? (
                      <div className="bg-[#131620] border border-blue-500/30 shadow-xl shadow-blue-900/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-6 text-center">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-2">
                              <Smartphone className="w-8 h-8 text-blue-400 animate-pulse" />
                          </div>
                          <div>
                              <h4 className="text-2xl font-bold text-white mb-2">Escanea el código QR</h4>
                              <p className="text-slate-400 text-sm max-w-md mx-auto">
                                  Para conectar la línea <strong className="text-blue-400">{qrData.sessionId}</strong>, abre WhatsApp en tu celular, ve a "Dispositivos vinculados" y apunta la cámara hacia este código.
                              </p>
                          </div>
                          <div className="bg-white p-6 rounded-2xl shadow-2xl mt-4">
                              <QRCode value={qrData.qr} size={250} />
                          </div>
                      </div>
                  ) : (
                      <div className="bg-[#131620] border border-white/5 rounded-2xl overflow-hidden">
                          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0b0e14]">
                              <h4 className="font-bold text-white flex items-center gap-2">
                                  <Smartphone className="w-5 h-5 text-emerald-500" /> Líneas Activas
                              </h4>
                          </div>
                          <div className="p-6 flex flex-col gap-4">
                              {sessions.length === 0 ? (
                                  <div className="text-center py-8 text-slate-500 text-sm bg-[#0b0e14] rounded-xl border border-white/5">
                                      No hay sesiones activas. Reinicia el servidor para generar una.
                                  </div>
                              ) : (
                                  sessions.map((session, idx) => (
                                      <div key={idx} className="bg-[#0b0e14] border border-white/5 rounded-xl p-5 flex items-center justify-between hover:border-white/10 transition-colors">
                                          <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                  <Smartphone className="w-6 h-6 text-emerald-500" />
                                              </div>
                                              <div>
                                                  <p className="text-white font-bold text-lg">{session}</p>
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
                                  ))
                              )}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* PESTAÑA: USUARIOS */}
          {activeTab === 'usuarios' && (
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
                              <option value="asesor">Asesor Estándar</option>
                              <option value="admin">Administrador Global</option>
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
              <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                  <div className="bg-[#131620] p-8 border border-white/5 rounded-2xl shadow-sm lg:w-1/3 flex-shrink-0 h-fit">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Package className="w-5 h-5 text-purple-500"/> Nuevo Producto</h3>
                    <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
                      
                      <div className="flex flex-col items-center">
                         <div 
                           className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 bg-[#0b0e14] flex flex-col items-center justify-center mb-2 overflow-hidden relative cursor-pointer hover:border-purple-500/50 transition-colors"
                           onClick={() => fileInputRef.current?.click()}
                         >
                            {imagePreview ? (
                               <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                               <>
                                  <UploadCloud className="w-8 h-8 text-slate-500 mb-1" />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Subir Foto</span>
                               </>
                            )}
                         </div>
                         <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                         <p className="text-[10px] text-slate-500">Recomendado: .webp o .png</p>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Producto</label>
                          <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ej: Licuadora Oster..." className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all" required />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Precio (S/)</label>
                            <input type="number" step="0.01" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="0.00" className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all" required />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Stock</label>
                            <input type="number" value={newProductStock} onChange={e => setNewProductStock(e.target.value)} placeholder="Ej: 10" className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all" required />
                        </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
                          <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} className="w-full mt-1 p-2.5 bg-[#0b0e14] border border-white/5 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-500 text-white transition-all cursor-pointer">
                              <option value="Televisores">Televisores</option>
                              <option value="Línea Blanca">Línea Blanca</option>
                              <option value="Pequeños">Pequeños Electrodomésticos</option>
                              <option value="Audio y Video">Audio y Video</option>
                              <option value="Tecnología">Tecnología</option>
                          </select>
                      </div>
                      
                      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 mt-2 transition-all shadow-lg shadow-purple-900/20">
                          <Plus className="w-4 h-4"/> Guardar en Inventario
                      </button>
                    </form>
                  </div>

                  {/* Lista de Productos */}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Package className="w-5 h-5 text-emerald-500"/> Catálogo Actual ({products.length})</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {products.length === 0 ? (
                            <p className="text-sm text-slate-500 col-span-2 p-6 bg-[#131620] border border-dashed border-white/10 rounded-2xl text-center">No hay productos en el inventario.</p>
                        ) : (
                            products.map((p) => (
                                <div key={p.id} className="bg-[#131620] p-4 border border-white/5 rounded-2xl shadow-sm hover:border-purple-500/30 transition-colors flex gap-4 items-center group">
                                    <img src={p.image.startsWith('data:image') ? p.image : 'https://placehold.co/100'} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-white/5 border border-white/5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-0.5">{p.category}</p>
                                        <p className="text-sm font-bold text-white leading-tight truncate" title={p.name}>{p.name}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                          <span className="font-bold text-emerald-400">S/ {Number(p.price).toLocaleString()}</span>
                                          <span className={`font-medium ${p.stock > 0 ? 'text-slate-400' : 'text-rose-400'}`}>Stock: {p.stock}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteProduct(p.id, p.name)} className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors opacity-0 group-hover:opacity-100" title="Eliminar Producto">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
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
                      
                      {/* Mensaje de Saludo Principal */}
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
                          {/* Opción 1 */}
                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-purple-400">Respuesta a Opción 1 (Ventas)</label>
                              <textarea 
                                value={botSettings.opt1_reply} 
                                onChange={e => setBotSettings({...botSettings, opt1_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          {/* Opción 2 */}
                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-blue-400">Respuesta a Opción 2 (Soporte)</label>
                              <textarea 
                                value={botSettings.opt2_reply} 
                                onChange={e => setBotSettings({...botSettings, opt2_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          {/* Opción 3 */}
                          <div className="bg-[#0b0e14] border border-white/5 p-4 rounded-xl">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block text-amber-400">Respuesta a Opción 3 (Envíos)</label>
                              <textarea 
                                value={botSettings.opt3_reply} 
                                onChange={e => setBotSettings({...botSettings, opt3_reply: e.target.value})} 
                                className="w-full h-20 p-3 bg-[#1a1d2d] border border-white/5 rounded-lg text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none" 
                                required 
                              />
                          </div>

                          {/* Opción 4 */}
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