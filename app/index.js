const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function initDb(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            const tmp = await mysql.createConnection({
                host: dbConfig.host,
                user: dbConfig.user,
                password: dbConfig.password,
            });
            await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
            await tmp.end();

            const pool = await mysql.createPool(dbConfig);
            await pool.query(`
        CREATE TABLE IF NOT EXISTS people (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `);
            return pool;
        } catch (err) {
            console.log(`DB init falhou (tentativa ${i+1}): ${err.message}`);
            await delay(3000);
        }
    }
    throw new Error('Não foi possível conectar ao MySQL');
}

(async () => {
    try {
        const pool = await initDb();

        app.get('/', async (req, res) => {
            await pool.query("INSERT INTO people (name) VALUES ('Full Cycle')");
            const [rows] = await pool.query("SELECT name FROM people");
            const list = rows.map(r => `<li>${r.name}</li>`).join('');
            res.send(`
        <h1>Full Cycle Rocks!</h1>
        <ul>${list}</ul>
      `);
        });

        app.listen(port, () => {
            console.log(`App rodando em http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Erro ao iniciar app:', err);
    }
})();
