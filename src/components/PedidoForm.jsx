import { useState, useEffect, use } from 'react';
import { api } from '../services/api';

export default function PedidoForm({ onPedidoCreado }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [clienteId, setClienteId] = useState('');
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
  const [cantidadInput, setCantidadInput] = useState(1);
  const [itemsCarrito, setItemsCarrito] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  // ESTADOS PARA LOS BUSCADORES DINAMICOS
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarClientes, setMostrarClientes] = useState(false);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarProductos, setMostrarProductos] = useState(false);

  // Cargar Clientes y Productos reales desde la API al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [listaClientes, listaProductos] = await Promise.all([
          api.getClientes(),
          api.getProductos()
        ]);
        setClientes(listaClientes);
        setProductos(listaProductos.filter(p => p.activo !== false));
      } catch (err) {
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los clientes o productos desde la API.' });
      }
    };
    cargarDatos();
  }, []);

  // FILTRADO EN TIEMPO REAL
  const clientesFiltrados = clientes.filter(c =>{
    const termino = busquedaCliente.toLowerCase().trim();
    if(!termino)return true;

    const nombre = String(c?.nombre || '').toLowerCase();
    const rut = String(c?.rut || '').toLowerCase();
    const email = String(c?.email || '').toLowerCase();

    return nombre.includes(termino) || rut.includes(termino) || email.includes(termino);
  });
  
  const productosFiltrados = productos.filter(p =>{
    const termino = busquedaProducto.toLowerCase().trim();
    if(!termino)return true;

    const nombre = String(p?.nombre || '').toLowerCase();
    const codigo = String(p?.codigo || '').toLowerCase();

    return nombre.includes(termino) || codigo.includes(termino);
  });
 

  const clienteSeleccionado = clientes.find(c => c.id === Number(clienteId));
  const productoSeleccionado = productos.find(p => p.id === Number(productoSeleccionadoId))

  const handleAgregarProducto = () => {
    if (!productoSeleccionadoId) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un producto para agregar.' });
      return;
    }

    const prod = productos.find((p) => p.id === Number(productoSeleccionadoId));
    if (!prod) return;

    const cant = Number(cantidadInput);
    if (cant <= 0 || cant > prod.stock) {
      setMensaje({ tipo: 'error', texto: `Cantidad inválida. Stock disponible: ${prod.stock}` });
      return;
    }

    const existe = itemsCarrito.find((item) => item.productoId === prod.id);
    if (existe) {
      setItemsCarrito(
        itemsCarrito.map((item) =>
          item.productoId === prod.id
            ? { ...item, cantidad: item.cantidad + cant, subtotal: (item.cantidad + cant) * item.precio }
            : item
        )
      );
    } else {
      setItemsCarrito([
        ...itemsCarrito,
        {
          productoId: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          cantidad: cant,
          subtotal: prod.precio * cant
        }
      ]);
    }

    setMensaje(null);
    setProductoSeleccionadoId('');
    setBusquedaProducto('');
    setCantidadInput(1);
  };

  const handleEliminarItem = (id) => {
    setItemsCarrito(itemsCarrito.filter((item) => item.productoId !== id));
  };

  const totalGeneral = itemsCarrito.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmitPedido = async (e) => {
    e.preventDefault();

    if (!clienteId) {
      setMensaje({ tipo: 'error', texto: 'Debes seleccionar un cliente para el pedido.' });
      return;
    }

    if (itemsCarrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto al pedido.' });
      return;
    }

    try {
      setCargando(true);
      setMensaje(null);

      // 🟢 Extraer el ID exacto del localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    const usuarioSesion = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

    const vendedorId = usuarioSesion?.id ? Number(usuarioSesion.id) : null;

      const nuevoPedido = {
        clienteId: Number(clienteId),
        usuarioId: vendedorId,
        fechaPedido: new Date().toISOString(),
        total: totalGeneral,
        detalles: itemsCarrito.map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precio
        }))
      };

      const respuesta = await api.crearPedido(nuevoPedido);

      setMensaje({ tipo: 'exito', texto: '¡Pedido enviado y guardado exitosamente!' });

      if (onPedidoCreado) {
        onPedidoCreado(respuesta);
      }

      setClienteId('');
      setBusquedaCliente('');
      setItemsCarrito([]);
    } catch (err) {
      console.error('Error enviado al backend:', err);
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.title || 'Error al procesar el pedido en la API.'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-3xl mx-auto my-6">
      <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Crear Nuevo Pedido</h2>
          <p className="text-xs text-slate-500">Selecciona cliente y detalla los productos</p>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-xs font-semibold mb-5 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* 🔍 SECCIÓN: BUSCAR / SELECCIONAR CLIENTE */}
      <div className="mb-6 relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Cliente *
        </label>

        {clienteSeleccionado ? (
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div>
              <p className="text-xs font-bold text-indigo-900">{clienteSeleccionado.nombre}</p>
              <p className="text-[11px] text-indigo-600">{clienteSeleccionado.rut ? `RUT: ${clienteSeleccionado.rut}` : 'Cliente Activo'}</p>
            </div>
            <button
              type="button"
              onClick={() => { setClienteId(''); setBusquedaCliente(''); }}
              className="text-xs font-bold text-rose-600 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Cambiar ✏️
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Escribe para buscar cliente por nombre o RUT..."
              value={busquedaCliente}
              onChange={(e) => {
                setBusquedaCliente(e.target.value);
                setMostrarClientes(true);
              }}
              onFocus={() => setMostrarClientes(true)}
              disabled={cargando}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />

            {mostrarClientes && busquedaCliente && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setClienteId(c.id);
                        setMostrarClientes(false);
                      }}
                      className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-800">{c.nombre}</p>
                      {c.rut && <p className="text-[10px] text-slate-500">RUT: {c.rut}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center">No se encontraron clientes</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

        {/* 🔍 SECCIÓN: BUSCAR Y AGREGAR PRODUCTOS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Agregar Productos al Pedido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6 relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Producto</label>
            
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={productoSeleccionado ? productoSeleccionado.nombre : busquedaProducto}
              onChange={(e) => {
                setProductoSeleccionadoId('');
                setBusquedaProducto(e.target.value);
                setMostrarProductos(true);
              }}
              onFocus={() => setMostrarProductos(true)}
              disabled={cargando}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

              {mostrarProductos && !productoSeleccionado && busquedaProducto && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProductoSeleccionadoId(p.id);
                        setMostrarProductos(false);
                      }}
                      className="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.nombre}</p>
                        <p className="text-[10px] text-slate-400">Stock: {p.stock}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        ${Number(p.precio).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center">No hay productos coincidentes</div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidadInput}
              onChange={(e) => setCantidadInput(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={cargando}
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleAgregarProducto}
              disabled={cargando || !productoSeleccionadoId}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-2 px-3 rounded-lg text-sm transition-all cursor-pointer"
            >
              + Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Carrito */}
            <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Detalle del Pedido</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCarrito.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-xs text-slate-400">
                    No has agregado productos al pedido todavía.
                  </td>
                </tr>
              ) : (
                itemsCarrito.map((item) => (
                  <tr key={item.productoId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{item.nombre}</td>
                    <td className="py-2.5 px-3 text-right">${item.precio.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.cantidad}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      ${item.subtotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarItem(item.productoId)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
        <div className="text-right w-full md:w-auto">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">Total a Pagar</span>
          <span className="text-2xl font-black text-indigo-600">${totalGeneral.toLocaleString()}</span>
        </div>

        <button
          type="button"
          onClick={handleSubmitPedido}
          disabled={cargando}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md text-sm cursor-pointer disabled:bg-slate-400"
        >
          {cargando ? 'Enviando Pedido...' : 'Confirmar y Guardar Pedido'}
        </button>
      </div>
    </div>
  );
}
