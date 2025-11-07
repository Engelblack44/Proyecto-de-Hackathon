const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vuelosdb',
  password: 'guerrero2001',
  port: 5432,
});

module.exports = pool;