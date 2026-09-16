import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ClienteTabla({ clientesLocales = [] }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Estados para Edición y Eliminación
  const [clienteEditando, setClienteEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // --- ESTADOS DE PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const datos = await api.getClientes();
      setClientes(datos || []);
    } catch (err) {
      if (clientesLocales) setClientes(clientesLocales);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const inicializar = async () => {
      try {
        setCargando(true);
        const datos = await api.getClientes();
        if (activo) setClientes(datos || []);
      } catch (err) {
        if (activo && clientesLocales) setClientes(clientesLocales);
      } finally {
        if (activo) setCargando(false);
      }
    };

    inicializar();
    return () => {
      activo = false;
    };
  }, []);

  // --- FILTRADO DE CLIENTES ---
  const clientesFiltrados = clientes.filter((c) => {
    const t = busqueda.toLowerCase().trim();
    const nombre = (c.nombre || '').toLowerCase();
    const rut = (c.rut || '').toLowerCase();

    return nombre.includes(t) || rut.includes(t);
  });

  // --- LÓGICA DE PAGINACIÓN SOBRE CLIENTES FILTRADOS ---
  const totalPaginas = Math.ceil(clientesFiltrados.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const clientesPAGINADOS = clientesFiltrados.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Reinicia la paginación a la primera página al filtrar por búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar al cliente "${nombre}"?`)) return;

    try {
      await api.eliminarCliente(id);
      setClientes(clientes.filter((c) => c.id !== id));
    } catch (err) {
      alert('Error al eliminar el cliente. Si tiene pedidos registrados, elimina o desvincula sus pedidos primero.');
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);

      // Mantenemos la estructura requerida por el modelo de C#
      const clienteDto = {
        id: clienteEditando.id,
        nombre: clienteEditando.nombre,
        rut: clienteEditando.rut,
        email: clienteEditando.email,
        fechaRegistro: clienteEditando.fechaRegistro,
        activo: clienteEditando.activo
      };

      await api.actualizarCliente(clienteEditando.id, clienteDto);

      setClientes(clientes.map((c) => (c.id === clienteEditando.id ? clienteDto : c)));
      setClienteEditando(null);
    } catch (err) {
      alert('Error al actualizar el cliente en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-4xl mx-auto my-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Listado de Clientes</h2>
          <p className="text-xs text-slate-500">Gestión de clientes y estado de cuenta</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, RUT"
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
            onClick={cargarClientes}
            disabled={cargando}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {cargando ? '🔄 Cargando...' : '🔄 Actualizar'}
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-8 text-xs text-slate-500 font-semibold">
          Cargando clientes...
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">RUT</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesPAGINADOS.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-xs text-slate-400">
                      {busqueda ? 'No se encontraron clientes coincidentes.' : 'No hay clientes registrados.'}
                    </td>
                  </tr>
                ) : (
                  clientesPAGINADOS.map((c, index) => (
                    <tr key={c.id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.rut}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{c.nombre}</td>
                      <td className="py-3 px-4 text-slate-500">{c.email || '—'}</td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            c.activo !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {c.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setClienteEditando({ ...c })}
                            className="p-1.5 text-xs bg-slate-100 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-slate-200 hover:border-blue-300 cursor-pointer"
                            title="Editar Cliente"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminar(c.id, c.nombre)}
                            className="p-1.5 text-xs bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-slate-200 hover:border-rose-300 cursor-pointer"
                            title="Eliminar Cliente"
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
          {clientesFiltrados.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
              <span className="text-xs text-slate-500">
                Mostrando <span className="font-semibold text-slate-800">{indiceInicio + 1}</span> a{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(indiceInicio + elementosPorPagina, clientesFiltrados.length)}
                </span>{' '}
                de <span className="font-semibold text-slate-800">{clientesFiltrados.length}</span> clientes
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
      {clienteEditando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              Editar Cliente #{clienteEditando.id}
            </h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">RUT</label>
                <input
                  type="text"
                  required
                  value={clienteEditando.rut || ''}
                  onChange={(e) => setClienteEditando({ ...clienteEditando, rut: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={clienteEditando.nombre || ''}
                  onChange={(e) => setClienteEditando({ ...clienteEditando, nombre: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={clienteEditando.email || ''}
                  onChange={(e) => setClienteEditando({ ...clienteEditando, email: e.target.value })}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="clienteActivo"
                  checked={clienteEditando.activo !== false}
                  onChange={(e) => setClienteEditando({ ...clienteEditando, activo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="clienteActivo" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Cliente Activo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClienteEditando(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}