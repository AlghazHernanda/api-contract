import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import axios from 'axios';
// import { modifyMovieResponse } from './controllers/movieController';
import movieRoutes from './routes/movieRoutes';
import { testConnection, initializeDatabase } from './utils/database';
import tvListRoutes from './routes/tvListRoutes';

// Load environment variables
dotenv.config();
// const THEMOVIDB_API_KEY = process.env.THEMOVIDB_API_KEY;
// const THEMOVIDB_BASE_URL = process.env.THEMOVIDB_BASE_URL || 'https://api.themoviedb.org/3';

const app = express();
const PORT = process.env.PROXY_PORT || 3001;


// Middleware
app.use(cors());
app.use(express.json());

// // Custom response interface 
// // sudah di pindahkan ke src/types/modifyMovie.ts
// interface ModifiedMovieResponse {
//   id: number;
//   title: string;
//   overview: string;
//   release_date: string;
//   poster_path: string;
//   budget: number;
//   revenue: number;
//   custom_fields: {
//     rating: number;
//     genre: string;
//     language: string;
//   };
// }

// Fungsi modifikasi response
// sudah di pindahkan ke src/controllers/movieController.ts
// function modifyMovieResponse(originalData: any): ModifyMovieTypes {
//   return {
//     id: originalData.id,
//     title: originalData.title,
//     overview: originalData.overview,
//     release_date: originalData.release_date,
//     poster_path: originalData.poster_path,
//     budget: originalData.budget,
//     revenue: originalData.revenue,
//     custom_fields: {
//       rating: Math.floor(Math.random() * 10) + 1,
//       genre: "Modified Genre",
//       language: "ID"
//     }
//   };
// }


// Proxy endpoint
// sudah di pindahkan ke src/routes/movieController lewat src/routes/movieRoutes.ts
// app.get('/movie_core/:id', async (req, res) => {
//   try {
//     const movieId = req.params.id;
    
//     // Hit third-party API
//     const response = await axios.get(`${THEMOVIDB_BASE_URL}/movie/${movieId}`, {
//       headers: {
//         'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
//         'accept': 'application/json'
//       }
//     });
    
//     // Modifikasi response
//     const modifiedData = modifyMovieResponse(response.data);
    
//     res.json(modifiedData);
//   } catch (error) {
//     console.error('Error fetching movie:', error);
//     res.status(500).json({ error: 'Failed to fetch movie data' });
//   }
// });


// Proxy endpoint
app.use('/api/movie_core', movieRoutes);
app.use('/api/tv_series_core', tvListRoutes);



// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'API Proxy' });
});

// Start server
async function startProxyServer() {
  try {
    // Try to connect to database
    console.log('Attempting to connect to database...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('Database connection successful!');
      // Initialize database
      await initializeDatabase();
    } else {
      console.log('⚠️  Database connection failed. Movie data will not be saved to database.');
      console.log('   Please check your MariaDB configuration in .env file');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 API Proxy running on port ${PORT}`);
      console.log('\n📋 Available endpoints:');
      console.log('  GET  /api/movie_core/detail/:id - Get movie details and save to DB');
      console.log('  GET  /api/movie_core/now_playing - Get now playing movies');
      console.log('  GET  /api/movie_core/showFavoriteMovies - Get movies ordered by favorite count');
      console.log('  GET  /api/tv_series_core/airing_today - Get TV series airing today');
      console.log('  GET  /health - Health check');
      console.log('\n🔗 Movie data will be automatically saved to database when accessing detail endpoint');
      console.log('📈 Favorite count increments each time a movie detail is accessed');
    });
  } catch (error) {
    console.error('Failed to start proxy server:', error);
    process.exit(1);
  }
}

startProxyServer();
