import { useState, useEffect } from 'react';
import { logout } from './services/api';
import Login from './components/Login';
import ClienteForm from './components/ClienteForm';
import ClienteTabla from './components/ClienteTabla';
import ProductoForm from './components/ProductoForm';
import ProductoTabla from './components/ProductoTabla';
import PedidoForm from './components/PedidoForm';
import PedidoTabla from './components/PedidoTabla';
import UsuarioAdmin from './components/UsuarioAdmin';
import VentasList from './components/VentasList';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modulo, setModulo] = useState('pedidos');
  const [vista, setVista] = useState('listar');

  useEffect(() => {
    try {
      // 1. Leemos únicamente 'usuario' de sessionStorage. Las cookies HttpOnly viajan solas en cada petición HTTP.
      const usuarioGuardado = sessionStorage.getItem('usuario');

      if (usuarioGuardado && usuarioGuardado !== "undefined") {
        setUsuario(JSON.parse(usuarioGuardado));
      }
    } catch (e) {
      console.error("Error al leer sesión:", e);
      sessionStorage.clear();
    } finally {
      setCargando(false);
    }
  }, []);

  // CERRAR SESION
  const handleLogout = async () => {
    try {
      // 2. Notificamos al backend para desarmar la cookie de la sesión
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      // 3. Limpiamos la UI
      sessionStorage.clear();
      setUsuario(null);
      setModulo('pedidos');
      setVista('listar');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <p className="text-sm font-semibold animate-pulse">Iniciando aplicación...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <Login
        onLoginSuccess={(usuarioData) => {
          setUsuario(usuarioData);
          setModulo('pedidos');
          setVista('listar');
        }}
      />
    );
  }

  const rolUsuario = usuario?.rol || usuario?.Rol || usuario?.role || usuario?.Role || '';
  const esAdmin = rolUsuario.toString().trim().toLowerCase() === 'admin';

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-black text-white tracking-wide">Gestión Pedidos</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Panel .NET 10</p>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setModulo('pedidos')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                modulo === 'pedidos' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span>📦</span>
              <span>Pedidos</span>
            </button>

            <button
              onClick={() => setModulo('ventas')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                modulo === 'ventas' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span>📊</span>
              <span>Ventas</span>
            </button>

            <button
              onClick={() => setModulo('clientes')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                modulo === 'clientes' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span>👤</span>
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setModulo('productos')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                modulo === 'productos' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span>🏷️</span>
              <span>Productos</span>
            </button>

            {esAdmin && (
              <button
                onClick={() => setModulo('usuarios')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  modulo === 'usuarios' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span>🔐</span>
                <span>Administración Usuarios</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-3 px-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">Usuario</p>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {usuario?.rol || 'Usuario'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-200 truncate mt-0.5">
              {usuario?.nombre || usuario?.usuario || 'Usuario'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold px-3 py-2 rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
          >
            Cerrar Sesión 🚪
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold capitalize text-slate-900">
            {modulo === 'usuarios'
              ? 'Administración de Usuarios'
              : modulo === 'ventas'
              ? esAdmin ? 'Reporte General de Ventas' : 'Mis Ventas Realizadas'
              : `Módulo: ${modulo}`}
          </h2>

          {modulo !== 'usuarios' && modulo !== 'ventas' && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setVista('crear')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  vista === 'crear' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                + Nuevo
              </button>
              <button
                onClick={() => setVista('listar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  vista === 'listar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                📋 Lista
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {modulo === 'pedidos' && (vista === 'crear' ? <PedidoForm /> : <PedidoTabla />)}
            {modulo === 'clientes' && (vista === 'crear' ? <ClienteForm /> : <ClienteTabla />)}
            {modulo === 'productos' && (vista === 'crear' ? <ProductoForm /> : <ProductoTabla />)}

            {modulo === 'ventas' && <VentasList />}

            {modulo === 'usuarios' && (
              esAdmin ? (
                <UsuarioAdmin />
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center">
                  <p className="text-rose-600 font-bold text-sm">
                    ⚠️ Acceso Denegado: No tienes permisos para administrar usuarios.
                  </p>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}