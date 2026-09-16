import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ProductoTabla({ productosLocales }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [productoEditando, setProductoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // --- ESTADOS DE PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const datos = await api.getProductos();
      setProductos(datos || []);
    } catch (err) {
      if (productosLocales) {
        setProductos(productosLocales);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const inicializar = async () => {
      try {
        setCargando(true);
        const datos = await api.getProductos();
        if (activo) {
          setProductos(datos || []);
        }
      } catch (err) {
        if (activo && productosLocales) {
          setProductos(productosLocales);
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    inicializar();
    return () => {
      activo = false; // Cancela actualizaciones si el componente se desmonta
    };
  }, []); // Executa únicamente 1 vez al cargar la tabla

  // --- FILTRADO DE PRODUCTOS ---
  const productosFiltrados = productos.filter((p) => {
    const t = busqueda.toLowerCase().trim();
    if (!t) {
      return true;
    }

    const id = (p.id ?? p.idProducto ?? '').toString();
    const nombre = (p.nombre || '').toLowerCase();
    const codigo = (p.codigo || '').toLowerCase();

    // SI SE BUSCA SOLO POR ID
    const soloID = /^\d+$/.test(t);
    if (soloID) {
      return id === t;
    }

    return nombre.includes(t) || codigo.includes(t);
  });

  // --- LÓGICA DE PAGINACIÓN SOBRE PRODUCTOS FILTRADOS ---
  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Manejador de búsqueda para reiniciar la paginación a la primera página
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) return;
    try {
      await api.eliminarProducto(id);
      setProductos(productos.filter((p) => p.id !== id));
    } catch (err) {
      alert('Error al eliminar el producto.');
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await api.actualizarProducto(productoEditando.id, productoEditando);
      setProductos(productos.map((p) => (p.id === productoEditando.id ? productoEditando : p)));
      setProductoEditando(null);
    } catch (err) {
      alert('Error al actualizar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-3xl mx-auto my-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catálogo de Productos</h2>
          <p className="text-xs text-slate-500">Inventario y disponibilidad</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="🔍 Buscar por id, código o nombre..."
              value={busqueda}
              onChange={handleBusquedaChange}
              className="w-full pl-3 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
            />
            {busqueda && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setPaginaActual(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={cargarProductos}
            disabled={cargando}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {cargando ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-8 text-xs text-slate-500 font-semibold">
          Cargando catálogo...
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">#ID</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-right">Precio</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-xs text-slate-400">
                      {busqueda ? 'No se encontraron productos coincidentes.' : 'No hay productos en inventario.'}
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((p, index) => (
                    <tr key={p.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">#{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.nombre}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ${Number(p.precio).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold">{p.stock}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          p.activo !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setProductoEditando({ ...p })} className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200 cursor-pointer">✏️</button>
                          <button onClick={() => handleEliminar(p.id, p.nombre)} className="p-1.5 text-xs bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-200 cursor-pointer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* BARRA DE PAGINACIÓN */}
          {productosFiltrados.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <span className="text-xs text-slate-500">
                Mostrando <span className="font-semibold text-slate-800">{indiceInicio + 1}</span> a{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(indiceInicio + elementosPorPagina, productosFiltrados.length)}
                </span>{' '}
                de <span className="font-semibold text-slate-800">{productosFiltrados.length}</span> productos
              </span>

              <div className="inline-flex items-center space-x-1">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Anterior
                </button>

                <span className="px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE EDICIÓN */}
      {productoEditando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Editar Producto</h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre</label>
                <input type="text" required value={productoEditando.nombre || ''} onChange={(e) => setProductoEditando({ ...productoEditando, nombre: e.target.value })} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Precio ($)</label>
                  <input type="number" required min="0" value={productoEditando.precio || 0} onChange={(e) => setProductoEditando({ ...productoEditando, precio: Number(e.target.value) })} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Stock</label>
                  <input type="number" required min="0" value={productoEditando.stock || 0} onChange={(e) => setProductoEditando({ ...productoEditando, stock: Number(e.target.value) })} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" checked={productoEditando.activo !== false} onChange={(e) => setProductoEditando({ ...productoEditando, activo: e.target.checked })} className="rounded" />
                <label htmlFor="activo" className="text-xs font-bold text-slate-600">Producto Activo</label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setProductoEditando(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancelar</button>
                <button type="submit" disabled={guardando} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 cursor-pointer">{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}