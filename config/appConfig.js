const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  'FS_PATH': 'fs',
  'DOCUMENT_VIEW_PATH': '/view/document',//Virtual Path for Download
  NODE_ENV: process.env.NODE_ENV,
  NODE_PORT: process.env.NODE_PORT,
  DB_URL: process.env.DB_URL,
  PYTHON_URL_W2P : process.env.PYTHON_URL_W2P,
  PYTHON_URL_CONFLITS : process.env.PYTHON_URL_CONFLITS,
  PYTHON_URL_MAPPING : process.env.PYTHON_URL_MAPPING,
  logMessage:{
    dberror : "Mongodb error",
    unhandlederror : "Unhanlded error",
    validatationerror : "Request validation failed"
  }
};