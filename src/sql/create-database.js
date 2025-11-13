require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");

// Configuración de conexión al servidor MySQL (sin DB seleccionada)
const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Si usas Docker o un puerto no estándar, inclúyelo
  // port: 3306
};

const DB_NAME = process.env.DB_NAME;
const SQL_SCHEMA_FILE = "./src/sql/schema.sql"; // Archivo con el CREATE TABLE, etc.
const SQL_DATA_FILE = "./src/sql/insert-data.sql"; // Archivo con los INSERTs, si es necesario

const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
  if (err) {
    console.error("Error al conectar al servidor MySQL:", err.message);
    return;
  }

  console.log("Conexión exitosa al servidor MySQL.");

  connection.query(
    `CREATE DATABASE IF NOT EXISTS ${DB_NAME}`,
    (err, results) => {
      if (err) {
        console.error(
          `Error al crear la base de datos ${DB_NAME}:`,
          err.message
        );
        connection.end();
        return;
      }
      console.log(`Base de datos "${DB_NAME}" creada o ya existe.`);

      const sqlScriptSchema = fs.readFileSync(SQL_SCHEMA_FILE, "utf8");
      const sqlScriptData = fs.readFileSync(SQL_DATA_FILE, "utf8");

      const dbConnection = mysql.createConnection({
        ...connectionConfig,
        database: DB_NAME,
        multipleStatements: true,
      });

      dbConnection.query(sqlScriptSchema, (err) => {
        if (err) {
          console.error("Error al crear las tablas", err.message);
          return;
        }
        console.log("-------- TABLAS CREADAS EXITOSAMENTE -------- .");
      });

      dbConnection.query(sqlScriptData, (err) => {
        dbConnection.end(); // Cerrar la nueva conexión
        if (err) {
          console.error("Error al insertar datos", err.message);
          return;
        }
        console.log("-------- DATOS INSERTADOS EXITOSAMENTE -------- .");
      });
    }
  );
});
