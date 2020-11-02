const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

//conectar a la BD
conectarDB();

//SERVER
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    //console.log(req.headers['authorization']);

    //console.log('req.headers=', req.headers);

    const token = req.headers['authorization'] || '';

    if (token) {
      try {
        const usuario = jwt.verify(
          token.replace('Bearer ', ''),
          process.env.SECRETA
        );
        //console.log('usuario ', JSON.stringify(usuario));

        return {
          usuario,
        };
      } catch (error) {
        console.log(error);
      }
    }
  },
});

//---< START THE SERVER
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Servidor running on URL ${url} `);
});
