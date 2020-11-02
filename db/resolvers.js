const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Pedido = require('../models/Pedido');
const { findByIdAndUpdate } = require('../models/Usuario');
require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
  // console.log(usuario);

  const { id, email, nombre, apellido } = usuario;

  return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
};

//---< RESOLVERS
const resolvers = {
  Query: {
    //----< USUARIOS
    // obtenerUsuario: async (_, { token }, ctx) => {
    obtenerUsuario: async (_, {}, ctx) => {
      //console.log('buscando token...');
      //console.log(token);

      // const usuarioId = await jwt.verify(token, process.env.SECRETA);

      // return usuarioId;
      return ctx.usuario;
    },
    //......................................................................

    //---< PRODUCTOS
    obtenerProductos: async () => {
      try {
        const productos = await Producto.find({});

        return productos;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    obtenerProducto: async (_, { id }) => {
      // revisar si el producto existe
      const producto = await Producto.findById(id);

      if (!producto) {
        throw new Error('Producto inexistente');
      }
      try {
      } catch (error) {
        console.log(error);
      }
      return producto;
    },

    //----< CLIENTES
    obtenerClientes: async () => {
      try {
        const clientes = await Cliente.find({});

        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    obtenerClientesVendedor: async (_, {}, ctx) => {
      // console.log(ctx.usuario.id);
      try {
        const clientes = await Cliente.find({
          vendedor: ctx.usuario.id.toString(),
        });

        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    obtenerCliente: async (_, { id }, ctx) => {
      // Revisar si el cliente existe o no porque si no, dará un bug
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error('Cliente no existente');
      }

      // console.log('cliente.vendedor = ', typeof cliente.vendedor.toString());
      // console.log('ctx.usuario.id   = ', typeof ctx.usuario.id);
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales');
      }
      return cliente;
      // Examinar quién creó ese cliente ( en caso de existir el mismo )
    },
    //......................................................................

    //----< PEDIIDOS
    obtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});

        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    obtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({
          vendedor: ctx.usuario.id,
        }).populate('cliente');

        // console.log('DJ-pedidos=', pedidos);

        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    obtenerPedido: async (_, { id }, ctx) => {
      // Revisar si el cliente existe o no porque si no, dará un bug
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error('Pedido no existente');
      }

      // console.log('pedido.vendedor = ', typeof pedido.vendedor.toString());
      // console.log('ctx.usuario.id   = ', typeof ctx.usuario.id);
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales');
      }
      return pedido;
      // Examinar quién creó ese cliente ( en caso de existir el mismo )
    },
    //......................................................................
    obtenerPedidoEstado: async (_, { estado }, ctx) => {
      const pedidos = await Pedido.find({
        vendedor: ctx.usuario.id,
        estado: estado,
      });

      return pedidos;
    },
    //......................................................................
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: 'COMPLETADO' } },
        {
          $group: {
            _id: '$cliente',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'clientes',
            localField: '_id',
            foreignField: '_id',
            as: 'cliente',
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: { total: -1 },
        },
      ]);
      return clientes;
    },
    //......................................................................
    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        { $match: { estado: 'COMPLETADO' } },
        {
          $group: {
            _id: '$vendedor',
            total: { $sum: '$total' },
          },
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: '_id',
            foreignField: '_id',
            as: 'vendedor',
          },
        },
        {
          $limit: 3,
        },
        {
          //DESCENDING Sort
          $sort: { total: -1 },
        },
      ]);
      return vendedores;
    },
    //......................................................................
    buscarProducto: async (_, { texto }) => {
      //console.log(texto);

      //const productos = await Producto.find({ $text: { $search: texto } });
      const productos = await Producto.find({
        nombre: { $regex: new RegExp(texto) },
      });
      // console.log(productos);
      return productos;
    },
    //......................................................................
  },

  Mutation: {
    //----< USUARIOS
    nuevoUsuario: async (_, { input }) => {
      // console.log(input);
      // return 'creando...';

      const { email, password } = input;

      //Revisar si el User se encuentra registrado
      const existeUsuario = await Usuario.findOne({ email });
      // console.log('existeUsuario ');
      // console.log(existeUsuario);

      if (existeUsuario) {
        throw new Error('El usuario ya se encuentra registrado');
      }

      //Hash the password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);
      // console.log('password: ');
      // console.log(input.password);

      // Guardar en la BD
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      //Si el USER existe
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error('Usuario no existe');
      }
      //---< Revisar si el PWD es correcto
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error('Password incorrecto');
      }

      //---< CREAR el TOKEN
      return {
        token: crearToken(existeUsuario, process.env.SECRETA, '24h'),
      };
    },
    //......................................................................

    //----< PRODUCTOS
    nuevoProducto: async (_, { input }) => {
      try {
        const producto = new Producto(input);

        //---< Almacenar en la BD
        const resultado = await producto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    actualizarProducto: async (_, { id, input }) => {
      let producto = await Producto.findById(id, function (err, docs) {
        if (err) {
          console.log(`código erróneo`);
          return null;
        } else {
          console.log('Result : ', docs);
        }
      });

      if (!producto) {
        throw new Error('Producto inexistente');
      }

      //Guardar el producto en la BD
      producto = await Producto.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return producto;
    },
    //......................................................................
    eliminarProducto: async (_, { id }) => {
      let producto = await Producto.findById(id);
      // console.log(producto);

      if (!producto) {
        throw new Error('producto no existente');
      }

      await Producto.findOneAndDelete({ _id: id });

      return 'Producto eliminado';
    },
    //......................................................................

    //#---< CLIENTES
    nuevoCliente: async (_, { input }, ctx) => {
      const { email } = input;
      //console.log(input);

      //---< Verificar si está registrado
      const cliente = await Cliente.findOne({ email });
      //console.log('cliente = ', cliente);

      if (cliente) {
        throw new Error('El cliente ya está registrado');
      }
      // console.log('sección que se ejecuta cuando el cliente no existe');
      const nuevoCliente = new Cliente(input);

      //Asignar el vendedor
      // console.log('context.usuario.id = ', ctx.usuario.id);
      // nuevoCliente.vendedor = '5f85168a04d12bbe5c1f06bb';
      nuevoCliente.vendedor = ctx.usuario.id;

      //Grabar en la Base de Datos
      try {
        const resultado = await nuevoCliente.save();
        return resultado;
        // console.log('se ha registrado en la BD');
        // return null;
      } catch (error) {
        console.log(error);
      }
    },
    //......................................................................
    actualizarCliente: async (_, { id, input }, ctx) => {
      let cliente = await Cliente.findById(id, function (err, docs) {
        if (err) {
          console.log(`código erróneo`);
        } else {
          console.log('Result : ', docs);
        }
      });

      if (!cliente) {
        throw new Error('Cliente no existe');
      }

      //verificar si es el vendedor es quien lo edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales');
      }

      //Guardar el cliente en la BD
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return cliente;
    },
    //......................................................................
    eliminarCliente: async (_, { id }, ctx) => {
      let cliente = await Cliente.findById(id);
      // console.log(cliente);

      if (!cliente) {
        throw new Error('cliente no existente');
      }

      //verificar si es el vendedor es quien lo edita
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales para eliminar el cliente');
      }

      await Cliente.findOneAndDelete({ _id: id });

      return 'Cliente eliminado';
    },
    //......................................................................

    //#---< PEDIDO
    nuevoPedido: async (_, { input }, ctx) => {
      const { cliente } = input;
      // console.log('cliente =', cliente);
      //Verificar si el cliente existe
      let clienteExiste = await Cliente.findById(cliente);

      if (!clienteExiste) {
        throw new Error('cliente inexistente');
      }

      //Verificar si el cliente es del vendedor
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error(
          'No posee las credenciales para generar un Pedido para este Cliente'
        );
      }

      for await (const articulo of input.pedido) {
        const { id } = articulo;

        const producto = await Producto.findById(id);

        //Revisar disponibilidad del Stock
        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El articulo ${producto.nombre} excede la cantidad disponible`
          );
        } else {
          producto.existencia -= articulo.cantidad;

          await producto.save();
        }
      }

      //Crear un nuevo pedido
      const nuevoPedido = new Pedido(input);

      //Asignarle un vendedor
      nuevoPedido.vendedor = ctx.usuario.id;

      //Guardarlo en la
      const resultado = await nuevoPedido.save();

      return resultado;
    },
    //......................................................................
    actualizarPedido: async (_, { id, input }, ctx) => {
      //Se verifica si el pedido existe mediante el id
      const existePedido = await Pedido.findById(id);

      if (!existePedido) {
        throw new Error('Pedido inexistente');
      }

      //Se verifica si el cliente existe
      const { cliente } = input;

      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) {
        throw new Error('Cliente inexistente');
      }

      //Se verifica si el vendedor posee las credenciales para actualizarlo
      if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales');
      }

      if (input.pedido) {
        for await (const articulo of input.pedido) {
          const { id } = articulo;

          const producto = await Producto.findById(id);

          //Revisar disponibilidad del Stock
          if (articulo.cantidad > producto.existencia) {
            throw new Error(
              `El articulo ${producto.nombre} excede la cantidad disponible`
            );
          } else {
            producto.existencia -= articulo.cantidad;

            await producto.save();
          }
        }
      }

      //Se verifica el stock

      //Se actualiza el pedido en la BD
      const resultado = await Pedido.findByIdAndUpdate({ _id: id }, input, {
        new: true,
      });

      return resultado;
    },
    //......................................................................
    eliminarPedido: async (_, { id, input }, ctx) => {
      let pedido = await Pedido.findById(id);
      // console.log(pedido);

      if (!pedido) {
        throw new Error('pedido no existente');
      }

      //verificar si es el vendedor es quien lo edita
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error('No posee las credenciales para eliminar el pedido');
      }

      //Cancelamos el PEDIDO
      pedido.estado = 'CANCELADO';
      // console.log(pedido);
      //return null;

      //EN CASO DE QUERERLO ELIMINAR DE LA
      // await Pedido.findByIdAndDelete({ _id: id });

      //Se actualiza el pedido en la BD
      const resultado = await Pedido.findByIdAndUpdate({ _id: id }, pedido, {
        new: true,
      });

      return 'Pedido eliminado';
    },
    //......................................................................
  },
};

module.exports = resolvers;
