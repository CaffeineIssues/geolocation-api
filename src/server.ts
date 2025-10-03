import dotenv from 'dotenv';
import app from '@/app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 geolocation api server running on http://localhost:${PORT}`);
});
