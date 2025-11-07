const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

// Obtener todos los vuelos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vuelos;');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar los vuelos', detalle: err.message });
  }
});

// Obtener vuelo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM vuelos WHERE id = $1;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar el vuelo', detalle: err.message });
  }
});

// Eliminar todos los vuelos
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM vuelos;');
    res.json({ mensaje: 'Todos los vuelos eliminados' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar los vuelos', detalle: err.message });
  }
});

// Obtener datos de OpenSky y guardar en la base de datos
router.post('/fetch-and-save', async (req, res) => {
  try {
    // Puedes modificar los parámetros de OpenSky según tus necesidades
    const response = await axios.get('https://opensky-network.org/api/states/all');
    const vuelos = response.data.states;

    if (!vuelos) {
      return res.status(404).json({ error: 'No se encontraron datos de OpenSky' });
    }

    let insertados = 0;
    for (const vuelo of vuelos) {
      // Mapear los datos a las columnas en español
      const query = `
        INSERT INTO vuelos (
          icao24, indicativo, pais_origen, tiempo_posicion, ultimo_contacto,
          longitud, latitud, altitud_baro, en_tierra, velocidad, rumbo,
          velocidad_vertical, sensores, altitud_geo, codigo_transpondedor, spi, fuente_posicion
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17
      );
      `;
      await pool.query(query, [
        vuelo[0], // icao24
        vuelo[1], // indicativo (callsign)
        vuelo[2], // pais_origen (origin_country)
        vuelo[3], // tiempo_posicion (time_position)
        vuelo[4], // ultimo_contacto (last_contact)
        vuelo[5], // longitud (longitude)
        vuelo[6], // latitud (latitude)
        vuelo[7], // altitud_baro (baro_altitude)
        vuelo[8], // en_tierra (on_ground)
        vuelo[9], // velocidad (velocity)
        vuelo[10], // rumbo (true_track)
        vuelo[11], // velocidad_vertical (vertical_rate)
        vuelo[12] ? vuelo[12].toString() : null, // sensores (sensors)
        vuelo[13], // altitud_geo (geo_altitude)
        vuelo[14], // codigo_transpondedor (squawk)
        vuelo[15], // spi
        vuelo[16]  // fuente_posicion (position_source)
      ]);
      insertados++;
    }
    res.json({ mensaje: `Vuelos insertados: ${insertados}` });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener/guardar datos de OpenSky', detalle: err.message });
  }
});

// Crear un vuelo manualmente
router.post('/', async (req, res) => {
  try {
    const {
      icao24, indicativo, pais_origen, tiempo_posicion, ultimo_contacto,
      longitud, latitud, altitud_baro, en_tierra, velocidad, rumbo,
      velocidad_vertical, sensores, altitud_geo, codigo_transpondedor, spi, fuente_posicion
    } = req.body;
    const query = `
      INSERT INTO vuelos (
        icao24, indicativo, pais_origen, tiempo_posicion, ultimo_contacto,
        longitud, latitud, altitud_baro, en_tierra, velocidad, rumbo,
        velocidad_vertical, sensores, altitud_geo, codigo_transpondedor, spi, fuente_posicion
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17
      ) RETURNING *;
    `;
    const result = await pool.query(query, [
      icao24, indicativo, pais_origen, tiempo_posicion, ultimo_contacto,
      longitud, latitud, altitud_baro, en_tierra, velocidad, rumbo,
      velocidad_vertical, sensores, altitud_geo, codigo_transpondedor, spi, fuente_posicion
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el vuelo', detalle: err.message });
  }
});

// Actualizar un vuelo por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campos = [
      'icao24', 'indicativo', 'pais_origen', 'tiempo_posicion', 'ultimo_contacto',
      'longitud', 'latitud', 'altitud_baro', 'en_tierra', 'velocidad', 'rumbo',
      'velocidad_vertical', 'sensores', 'altitud_geo', 'codigo_transpondedor', 'spi', 'fuente_posicion'
    ];
    const valores = campos.map(c => req.body[c]);
    const setQuery = campos.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const query = `UPDATE vuelos SET ${setQuery} WHERE id = $18 RETURNING *;`;
    const result = await pool.query(query, [...valores, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vuelo no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el vuelo', detalle: err.message });
  }
});

module.exports = router;