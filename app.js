const express = require('express');
const app = express();
const vuelosRoutes = require('./routes/vuelos');
const zabbixRoutes = require('./routes/zabbix');

app.use(express.json());
app.use('/api/vuelos', vuelosRoutes);
app.use('/api', zabbixRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/api', dashboardRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});