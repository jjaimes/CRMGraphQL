const mongoose = require('mongoose');
require('dotenv').config({ path: 'variables.env' });
console.log(process.env.DB_MONGO);

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.DB_MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
    });
    console.log('Conectado con la BD');
  } catch (error) {
    console.log('hubo un error');
    console.log(error);
    process.exit(1);
  }
};

module.exports = conectarDB;
