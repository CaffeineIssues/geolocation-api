import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import axios from 'axios';
//import routes from './routes';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Routes

app.get('/', (req, res) => {
  res.send('Hello from Express with TypeScript!');
});

// ========== Geolocation API MVP Routes ==========

// 1. IP → Location
app.get('/ip/:ip', async (req: Request, res: Response) => {
  const { ip } = req.params;
  try {
    // Example using ipapi.co (can replace with MaxMind, ipstack, etc.)
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data as {
      city?: string;
      region?: string;
      country_name?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
      org?: string;
    };
    res.json({
      ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to fetch IP data' });
  }
});

// 2. Coordinates → Address (Reverse Geocoding)
app.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: true, message: 'Missing lat/lon' });

  try {
    // Using OpenStreetMap Nominatim
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: { lat, lon, format: 'json' },
    });
    const data = response.data as { display_name?: string };
    res.json({
      latitude: lat,
      longitude: lon,
      address: data.display_name,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to fetch address' });
  }
});

// 3. Address → Coordinates (Geocoding)
app.get('/geocode', async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: true, message: 'Missing address' });

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: address, format: 'json', limit: 1 },
    });
    const data = response.data as Array<{ lat: string; lon: string; display_name: string }>;
    if (data.length === 0) {
      return res.status(404).json({ error: true, message: 'Address not found' });
    }
    const place = data[0];
    res.json({
      query: address,
      latitude: place.lat,
      longitude: place.lon,
      formatted_address: place.display_name,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to fetch coordinates' });
  }
});

// 4. Distance Calculation (Haversine formula)
app.get('/distance', (req: Request, res: Response) => {
  const { fromLat, fromLon, toLat, toLon } = req.query;
  if (!fromLat || !fromLon || !toLat || !toLon) {
    return res.status(400).json({ error: true, message: 'Missing coordinates' });
  }

  const R = 6371; // Earth radius in km
  const dLat = ((Number(toLat) - Number(fromLat)) * Math.PI) / 180;
  const dLon = ((Number(toLon) - Number(fromLon)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(fromLat) * Math.PI) / 180) *
      Math.cos((Number(toLat) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  res.json({
    from: { latitude: fromLat, longitude: fromLon },
    to: { latitude: toLat, longitude: toLon },
    distance_km: distanceKm,
    distance_miles: distanceKm * 0.621371,
  });
});

// 5. Time Zone Lookup
app.get('/timezone', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: true, message: 'Missing lat/lon' });

  try {
    // Example using TimezoneDB or Google Timezone API
    const response = await axios.get(`http://worldtimeapi.org/api/timezone/Etc/GMT`);
    const data = response.data as { timezone: string; utc_offset: string; datetime: string };
    res.json({
      latitude: lat,
      longitude: lon,
      timezone: data.timezone,
      utc_offset: data.utc_offset,
      current_time: data.datetime,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: 'Failed to fetch timezone' });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
