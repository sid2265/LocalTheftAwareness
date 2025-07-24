import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Peter@25', // Replace 'yourpassword' with the correct password
    database: 'local_theft_awareness',
  });

// Routes
app.post('/submit-report', async (req, res) => {
  const { station, datetime, description } = req.body;

  try {
    // Fetch lat/lng for the station
    const [stationData] = await db.execute('SELECT lat, lng FROM stations WHERE name = ?', [station]);

    if (stationData.length === 0) {
    return res.status(400).send({ error: 'Station not found' });
    }

    const { lat, lng } = stationData[0];

    // Insert theft report
    const formattedDatetime = datetime ? datetime.replace('T', ' ').split('.')[0] : null;

    console.log(`Inserting report: Station=${station}, Datetime=${formattedDatetime}, Description=${description}, Lat=${lat}, Lng=${lng}`);

    await db.execute(
    'INSERT INTO theft_reports (station, datetime, description, lat, lng) VALUES (?, ?, ?, ?, ?)',
    [station, formattedDatetime, description, lat, lng]
    );

    res.status(200).send({ message: 'Report submitted successfully!' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/hotspots', async (req, res) => {
  try {
    const [stations] = await db.execute('SELECT * FROM stations');
    const [theftReports] = await db.execute('SELECT station FROM theft_reports');

    const theftCounts = {};
    theftReports.forEach(report => {
      theftCounts[report.station] = (theftCounts[report.station] || 0) + 1;
    });

    const hotspots = stations.map(station => ({
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      theftCount: theftCounts[station.name] || 0,
    }));

    res.status(200).send(hotspots);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

app.get('/reports', async (req, res) => {
    try {
      const [reports] = await db.execute('SELECT * FROM theft_reports');
      res.status(200).send(reports);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });