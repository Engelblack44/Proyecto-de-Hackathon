const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuración Zabbix
const ZABBIX_URL = 'https://amused-echidna.zabbix.cloud/api_jsonrpc.php';
const ZABBIX_USER = 'raza_117@outlook.com';
const ZABBIX_PASSWORD = 'Guerrero_2001';

// --- LOGIN ZABBIX ---
async function zabbixLogin() {
  try {
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
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    return response.data.result;
  } catch (err) {
    throw new Error('Error autenticando en Zabbix: ' + (err.response?.data?.error ? JSON.stringify(err.response.data.error) : err.message));
  }
}

// --- ENDPOINTS ZABBIX ---

// Estado de la API Zabbix (POST para probar JSON-RPC directo)
router.post('/zabbix/status', async (req, res) => {
  try {
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "apiinfo.version",
      params: [],
      auth: null,
      id: 1
    });
    res.json({ status: response.status, data: response.data });
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar Zabbix Cloud', detalle: err.message, stack: err.stack });
  }
});

// GET: Hosts
router.get('/zabbix/hosts', async (req, res) => {
  try {
    const auth = await zabbixLogin();
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "host.get",
      params: { output: "extend" },
      auth: auth,
      id: 2
    }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando Zabbix', details: error.message, stack: error.stack });
  }
});

// POST: Crear host de prueba
router.post('/zabbix/hosts', async (req, res) => {
  try {
    const auth = await zabbixLogin();
    const { host, ip } = req.body;
    if (!host || !ip) {
      return res.status(400).json({ error: 'Faltan parámetros: host, ip' });
    }
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "host.create",
      params: {
        host: host,
        interfaces: [
          {
            type: 1,
            main: 1,
            useip: 1,
            ip: ip,
            dns: "",
            port: "10050"
          }
        ],
        groups: [{ groupid: "2" }], // Grupo "Linux servers" por defecto
        templates: [], // Puedes agregar templates si lo deseas
      },
      auth: auth,
      id: 10
    }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    res.json({ resultado: response.data.result });
  } catch (error) {
    res.status(500).json({ error: 'Error creando host', details: error.message, stack: error.stack });
  }
});

// GET: Triggers
router.get('/zabbix/triggers', async (req, res) => {
  try {
    const auth = await zabbixLogin();
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "trigger.get",
      params: { output: "extend", expandDescription: true },
      auth: auth,
      id: 3
    }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando triggers', details: error.message, stack: error.stack });
  }
});

// GET: Items
router.get('/zabbix/items', async (req, res) => {
  try {
    const auth = await zabbixLogin();
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "item.get",
      params: { output: "extend" },
      auth: auth,
      id: 4
    }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando items', details: error.message, stack: error.stack });
  }
});

// GET: Eventos
router.get('/zabbix/events', async (req, res) => {
  try {
    const auth = await zabbixLogin();
    const response = await axios.post(ZABBIX_URL, {
      jsonrpc: "2.0",
      method: "event.get",
      params: { output: "extend" },
      auth: auth,
      id: 5
    }, { headers: { 'Content-Type': 'application/json' } });
    if (response.data.error) throw new Error(JSON.stringify(response.data.error));
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando eventos', details: error.message, stack: error.stack });
  }
});

// --- TEST LOGIN ZABBIX ---
router.get('/zabbix/login-test', async (req, res) => {
  try {
    const token = await zabbixLogin();
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});

module.exports = router;