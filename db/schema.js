const { gql } = require('apollo-server');

//---< SCHEMA
const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    fecha: String
  }

  type Token {
    token: String
  }

  type Producto {
    id: ID
    nombre: String
    existencia: Int
    precio: Float
    creado: String
  }

  type Cliente {
    id: ID
    nombre: String
    apellido: String
    empresa: String
    email: String
    telefono: String
    vendedor: ID
  }

  type Pedido {
    id: ID
    pedido: [PedidoGrupo]
    total: Float
    cliente: Cliente
    vendedor: ID
    creado: String
    estado: EstadoPedido
  }

  type PedidoGrupo {
    id: ID #ID del producto
    cantidad: Int
    nombre: String
    precio: Float
  }

  type TopCliente {
    total: Float
    cliente: [Cliente]
  }

  type TopVendedor {
    total: Float
    vendedor: [Usuario]
  }

  input UsuarioInput {
    nombre: String!
    apellido: String
    email: String
    password: String
  }

  input ProductoInput {
    nombre: String!
    existencia: Int!
    precio: Float!
  }

  input AutenticarInput {
    email: String!
    password: String!
  }

  input ClienteInput {
    nombre: String!
    apellido: String!
    empresa: String!
    email: String!
    telefono: String
    #vendedor: ID (se obtiene vía CONTEXT)
  }

  input PedidoProductoInput {
    id: ID #ID del producto
    cantidad: Int
    nombre: String
    precio: Float
  }

  input PedidoInput {
    pedido: [PedidoProductoInput]
    total: Float
    cliente: ID
    estado: EstadoPedido
  }

  enum EstadoPedido {
    PENDIENTE
    COMPLETADO
    CANCELADO
  }

  type Query {
    #-----< USUARIOS
    # obtenerUsuario(token: String!): Usuario
    obtenerUsuario: Usuario

    #-----< PRODUCTOS
    obtenerProductos: [Producto]
    obtenerProducto(id: ID!): Producto

    #-----< CLIENTES
    obtenerClientes: [Cliente]
    obtenerClientesVendedor: [Cliente]
    obtenerCliente(id: ID!): Cliente

    #-----< PEDIDOS
    obtenerPedidos: [Pedido]
    obtenerPedidosVendedor: [Pedido]
    obtenerPedido(id: ID!): Pedido
    obtenerPedidoEstado(estado: String!): [Pedido]

    #-----< BÚSQUEDAS AVANZADAS
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedor]
    buscarProducto(texto: String!): [Producto]
  }

  type Mutation {
    #-----< USUARIOS
    nuevoUsuario(input: UsuarioInput): Usuario
    autenticarUsuario(input: AutenticarInput): Token

    #-----< PRODUCTOS
    nuevoProducto(input: ProductoInput): Producto
    actualizarProducto(id: ID!, input: ProductoInput): Producto
    eliminarProducto(id: ID!): String

    #-----< CLIENTES
    nuevoCliente(input: ClienteInput): Cliente
    actualizarCliente(id: ID!, input: ClienteInput): Cliente
    eliminarCliente(id: ID!): String

    #-----< PEDIDOS
    nuevoPedido(input: PedidoInput): Pedido
    actualizarPedido(id: ID!, input: PedidoInput): Pedido
    eliminarPedido(id: ID!): String
  }
`;

module.exports = typeDefs;
