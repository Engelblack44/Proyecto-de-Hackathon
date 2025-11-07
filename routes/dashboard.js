const express = require('express');
const axios = require('axios');
const pool = require('../db');

// Configuración de Zabbix
const ZABBIX_URL = 'http://amused-echidna.zabbix.cloud:10051/api_jsonrpc.php';
const ZABBIX_USER = 'raza_117@outlook.com';      // <-- Cambia esto por tu usuario de Zabbix
const ZABBIX_PASSWORD = 'Guerrero_2001'; // <-- Cambia esto por tu contraseña de Zabbix

const router = express.Router();

async function zabbixLogin() {
    const response = await axios.post(ZABBIX_URL, {
        jsonrpc: "2.0",
        method: "user.login",
        params: {
            user: ZABBIX_USER,
            password: ZABBIX_PASSWORD
        },
        id: 1
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data.result;
}

router.get('/dashboard', async (req, res) => {
    try {
        // Vuelos
        const vuelosResult = await pool.query('SELECT * FROM vuelos');
        // Zabbix
        const auth = await zabbixLogin();
        const zabbixResult = await axios.post(ZABBIX_URL, {
            jsonrpc: "2.0",
            method: "host.get",
            params: { output: "extend" },
            auth: auth,
            id: 2
        }, { headers: { 'Content-Type': 'application/json' } });

        res.json({
            vuelos: vuelosResult.rows,
            zabbix_hosts: zabbixResult.data.result
        });
    } catch (error) {
        res.status(500).json({ error: 'Error consultando dashboard', details: error.message });
    }
});

module.exports = router;