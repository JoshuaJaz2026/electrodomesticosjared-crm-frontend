import { useState, useEffect } from "react";
import { X, Search, Package, ShoppingCart, Send, Plus, Minus, Trash2, FileText } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type CatalogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendQuote: (cartItems: any[], total: number) => void; 
  socket: any; 
};

export default function CatalogModal({ isOpen, onClose, onSendQuote, socket }: CatalogModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    socket.emit('get-products'); 
    
    const handleLoadProducts = (data: Product[]) => {
      if (data) setProducts(data);
    };
    
    socket.on('load-products', handleLoadProducts);
    return () => { socket.off('load-products', handleLoadProducts); };
  }, [isOpen, socket]);

  useEffect(() => {
    if (!isOpen) { setCart([]); setSearchTerm(""); }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0) return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.product.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const generateQuoteAndSend = () => {
    if (cart.length === 0) {
      alert("Agrega al menos un producto.");
      return;
    }

    // Aplanamos el carrito para que coincida exactamente con la estructura que espera page.tsx
    const flatCart = cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image
    }));

    onSendQuote(flatCart, totalAmount);
    setCart([]); // Limpiamos el carrito después de enviar
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-[#131620] border border-white/5 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* LADO IZQUIERDO: CATÁLOGO DE PRODUCTOS */}
        <div className="flex-1 flex flex-col border-r border-white/5 bg-[#0b0e14]">
          <div className="p-4 bg-[#131620] border-b border-white/5 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500"/> Inventario
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition md:hidden"><X className="w-5 h-5 text-slate-400"/></button>
          </div>
          
          <div className="p-4 bg-[#131620] border-b border-white/5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Buscar por nombre o categoría..." 
                className="w-full pl-9 pr-4 py-2 bg-[#0b0e14] border border-white/5 rounded-xl text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <p className="col-span-2 text-center text-slate-500 text-sm py-10">No se encontraron productos.</p>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="bg-[#131620] border border-white/5 p-3 rounded-xl flex gap-3 items-center hover:border-purple-500/30 transition-colors group">
                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg bg-white/5" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">{product.category}</p>
                      <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-2" title={product.name}>{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium">
                        <span className="text-emerald-400">S/ {Number(product.price).toLocaleString()}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${product.stock > 0 ? "bg-slate-800 text-slate-300" : "bg-rose-500/20 text-rose-400"}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-full py-1.5 bg-white/5 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all flex justify-center items-center gap-1.5 group-hover:bg-purple-600/20 group-hover:text-purple-300 border border-transparent group-hover:border-purple-500/30 uppercase tracking-wide"
                      >
                        <Plus className="w-3 h-3"/> Agregar {product.stock <= 0 && '(Sin Stock)'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LADO DERECHO: CARRITO / COTIZADOR */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-[#131620] flex-shrink-0">
          <div className="p-4 bg-[#0b0e14] border-b border-white/5 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500"/> Cotización
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition hidden md:block"><X className="w-5 h-5 text-slate-400"/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-700">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                   <ShoppingCart className="w-12 h-12 mb-3" />
                   <p className="text-sm font-medium text-center px-4">Agrega productos desde el inventario para armar la cotización.</p>
               </div>
            ) : (
                cart.map(item => (
                    <div key={item.product.id} className="bg-[#0b0e14] border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-white leading-tight flex-1">
                                {item.product.name} 
                                {item.product.stock <= 0 && <span className="text-[9px] text-rose-400 block font-normal">(Venta bajo pedido)</span>}
                            </h4>
                            <button onClick={() => removeFromCart(item.product.id)} className="text-slate-500 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2 bg-[#131620] border border-white/5 rounded-lg p-1">
                                <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-white/10 rounded-md text-slate-300"><Minus className="w-3 h-3"/></button>
                                <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-white/10 rounded-md text-slate-300"><Plus className="w-3 h-3"/></button>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">S/ {(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                    </div>
                ))
            )}
          </div>

          {/* TOTAL Y BOTÓN DE ENVIAR */}
          <div className="p-4 bg-[#0b0e14] border-t border-white/5">
             <div className="flex justify-between items-center mb-4">
                 <span className="text-slate-400 text-sm font-medium">Total Estimado</span>
                 <span className="text-xl font-black text-white">S/ {totalAmount.toLocaleString()}</span>
             </div>
             <button 
                onClick={generateQuoteAndSend}
                disabled={cart.length === 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
             >
                <Send className="w-4 h-4"/> Enviar Cotización al Chat
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}