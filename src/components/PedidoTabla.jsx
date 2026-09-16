import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

export default function PedidoTabla({ usuarioId, rol, pedidosLocales = [] }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Estados para Edición y Vista de Boleta
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Carga de pedidos parametrizada con usuarioId y rol
  const cargarPedidos = useCallback(async () => {
    try {
      setCargando(true);
      // Pasa usuarioId y rol a la API (endpoint api/Pedidos/Listar)
      const datos = await api.getPedidos(usuarioId, rol);
      setPedidos(datos || []);
    } catch (err) {
      console.error('Error al obtener pedidos:', err);
      if (pedidosLocales && pedidosLocales.length > 0) {
        setPedidos(pedidosLocales);
      }
    } finally {
      setCargando(false);
    }
  }, [usuarioId, rol, pedidosLocales]);

  useEffect(() => {
    let activo = true;

    const inicializar = async () => {
      try {
        setCargando(true);

      // 1. SETEAR / OBTENER LOS VALORES DE LA SESIÓN:
      const usuarioGuardado = JSON.parse(sessionStorage.getItem('usuario') || '{}');
      const iduser = usuarioId || usuarioGuardado.id || usuarioGuardado.usuarioId;
      const roluser = rol || usuarioGuardado.rol;

        const datos = await api.getPedidos(iduser, roluser);
        if (activo) {
          setPedidos(datos || []);
        }
      } catch (err) {
        if (activo && pedidosLocales && pedidosLocales.length > 0) {
          setPedidos(pedidosLocales);
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    inicializar();

    return () => {
      activo = false;
    };
  }, [usuarioId, rol]); // Dependencias primitivas (string / number) evitan renders infinitos

  // --- FILTRADO DE PEDIDOS ---
  const pedidosFiltrados = pedidos.filter((p) => {
    const t = busqueda.toLowerCase().trim();
    if (!t) return true;

    const id = (p.id ?? p.idPedido ?? '').toString();
    const cliente = (p.nombreCliente || p.clienteNombre || `cliente #${p.clienteId || ''}`).toLowerCase();
    const estado = (p.estado || '').toLowerCase();

    const soloID = /^\d+$/.test(t);
    if (soloID) {
      return id === t;
    }

    return cliente.includes(t) || estado.includes(t);
  });

  // --- PAGINACIÓN ---
  const totalPaginas = Math.ceil(pedidosFiltrados.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  // --- ELIMINAR PEDIDO ---
  const handleEliminar = async (id) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas anular/eliminar el pedido #${id}?`);
    if (!confirmar) return;

    try {
      await api.eliminarPedido(id);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Error al eliminar el pedido.');
    }
  };

  // --- GUARDAR EDICIÓN ---
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await api.actualizarPedido(pedidoEditando.id, pedidoEditando);

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoEditando.id ? { ...p, ...pedidoEditando } : p))
      );
      setModoEdicion(false);
    } catch (err) {
      alert('Error al actualizar el pedido.');
    } finally {
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const abrirDetalle = (pedido) => {
    setPedidoEditando({ ...pedido });
    setModoEdicion(false);
  };

  const getEstiloEstado = (estado = '') => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'procesando':
      case 'procesado':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelado':
      case 'anulado':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-5xl mx-auto my-6 print:shadow-none print:border-none print:p-0 print:m-0">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-5 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Historial de Pedidos</h2>
          <p className="text-xs text-slate-500">
            {rol === 'admin' ? 'Mostrando todos los pedidos del sistema (Vista Administrador)' : 'Órdenes de compra registradas'}
          </p>
        </div>

        {/* Búsqueda y Actualizar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="🔍 Buscar por # ID o cliente..."
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
            onClick={cargarPedidos}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-8 text-xs text-slate-500 font-semibold print:hidden">
          Cargando pedidos desde el servidor...
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 print:hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4"># Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-center">Fecha</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-xs text-slate-400">
                      {busqueda ? 'No se encontraron pedidos con ese criterio.' : 'No hay pedidos registrados aún.'}
                    </td>
                  </tr>
                ) : (
                  pedidosPaginados.map((p, index) => (
                    <tr key={p.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">#{p.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.nombreCliente || p.clienteNombre || `Cliente #${p.clienteId}`}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {p.fechaPedido ? new Date(p.fechaPedido).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ${Number(p.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getEstiloEstado(p.estado)}`}>
                          {p.estado || 'Completado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => abrirDetalle(p)}
                            className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-slate-200 hover:border-blue-300 cursor-pointer"
                            title="Ver Boleta / Factura"
                          >
                            📄 Ver Boleta
                          </button>
                          <button
                            onClick={() => handleEliminar(p.id)}
                            className="p-1.5 text-xs bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-slate-200 hover:border-rose-300 cursor-pointer"
                            title="Eliminar Pedido"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* BARRA DE PAGINACIÓN */}
          {pedidosFiltrados.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 print:hidden">
              <span className="text-xs text-slate-500">
                Mostrando <span className="font-semibold text-slate-800">{indiceInicio + 1}</span> a{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(indiceInicio + elementosPorPagina, pedidosFiltrados.length)}
                </span>{' '}
                de <span className="font-semibold text-slate-800">{pedidosFiltrados.length}</span> pedidos
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

      {/* MODAL / BOLETA IMPRESA */}
      {pedidoEditando && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:p-0 print:static print:bg-white print:block">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:max-w-full print:p-0 print:overflow-visible">
            
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-wider uppercase">BOLETA DE VENTA</h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">SISTEMA DE GESTIÓN Y VENTAS</p>
              </div>

              <div className="text-right border-2 border-slate-800 p-3 rounded-lg bg-slate-50 print:bg-transparent">
                <p className="text-xs font-bold text-slate-500 uppercase">FOLIO N°</p>
                <p className="text-lg font-mono font-black text-slate-900">#{String(pedidoEditando.id).padStart(6, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs print:bg-transparent print:p-0 print:border-none">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Datos del Cliente</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {pedidoEditando.nombreCliente || pedidoEditando.clienteNombre || `Cliente #${pedidoEditando.clienteId}`}
                </p>
                {pedidoEditando.rutCliente && <p className="text-slate-600">RUT: {pedidoEditando.rutCliente}</p>}
                {pedidoEditando.direccion && <p className="text-slate-600">Dirección: {pedidoEditando.direccion}</p>}
              </div>

              <div className="text-right">
                <p className="text-slate-400 font-bold uppercase text-[10px]">Detalles de Emisión</p>
                <p className="text-slate-700 font-medium mt-0.5">
                  <strong>Fecha:</strong> {pedidoEditando.fechaPedido ? new Date(pedidoEditando.fechaPedido).toLocaleDateString() : '—'}
                </p>
                <p className="text-slate-700 font-medium">
                  <strong>Estado:</strong>{' '}
                  <span className={`uppercase font-bold px-2 py-0.5 rounded border text-[11px] ${getEstiloEstado(pedidoEditando.estado)}`}>
                    {pedidoEditando.estado || 'Completado'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-800 font-bold uppercase">
                    <th className="py-2 px-2">Descripción</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-2 text-right">P. Unitario</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {pedidoEditando.detalles && pedidoEditando.detalles.length > 0 ? (
                    pedidoEditando.detalles.map((item, idx) => {
                      const cant = Number(item.cantidad || 0);
                      const precio = Number(item.precioUnitario || 0);
                      const subtotal = item.subtotal ?? (cant * precio);

                      return (
                        <tr key={item.productoId || idx}>
                          <td className="py-3 px-2 font-medium text-slate-800">
                            {item.nombreProducto || `Producto #${item.productoId}`}
                          </td>
                          <td className="py-3 px-2 text-center font-bold">{cant}</td>
                          <td className="py-3 px-2 text-right font-mono">${precio.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                            ${subtotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                        Sin detalle de productos especificado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t-2 border-slate-800 pt-4 mb-6">
              <div className="w-1/2 space-y-1 text-right text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-500 uppercase">Total a Pagar:</span>
                  <span className="font-mono text-base font-black text-slate-900">
                    ${Number(pedidoEditando.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4 uppercase">
              *** Gracias por su compra ***
            </div>

            {/* SECCIÓN DE EDICIÓN */}
            {modoEdicion && (
              <form onSubmit={handleGuardarEdicion} className="mt-6 pt-6 border-t border-dashed border-slate-300 bg-slate-50 p-4 rounded-xl print:hidden">
                <h4 className="text-xs font-bold uppercase text-slate-700 mb-3">Modificar Registro del Pedido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado</label>
                    <select
                      value={pedidoEditando.estado || 'Completado'}
                      onChange={(e) => setPedidoEditando({ ...pedidoEditando, estado: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Procesando">Procesando</option>
                      <option value="Completado">Completado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Total ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pedidoEditando.total || 0}
                      onChange={(e) => setPedidoEditando({ ...pedidoEditando, total: Number(e.target.value) })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {guardando ? 'Guardando...' : 'Aplicar Cambios'}
                  </button>
                </div>
              </form>
            )}

            {/* BARRA DE ACCIONES DEL MODAL */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 print:hidden">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleImprimir}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer border border-slate-300"
                >
                  🖨️ Imprimir Boleta
                </button>
                <button
                  type="button"
                  onClick={() => setModoEdicion(!modoEdicion)}
                  className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  {modoEdicion ? 'Ocultar Edición' : '✏️ Editar Datos'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPedidoEditando(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}