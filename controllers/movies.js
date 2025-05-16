const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/original';
const API_KEY = process.env.TMDB_API_KEY;
console.log(API_KEY);

if (!API_KEY) {
  throw new Error('TMDB_API_KEY is not configured');
}

exports.home = (req, res) => {
  res.send({ msg: 'Server is running' });
};

exports.movies = async (req, res) => {
  try {
    const movieRes = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        page: 1,
      },
    });

    const movies = movieRes.data.results;

    const detailedMovies = await Promise.all(
      movies.slice(0, 10).map(async (movie) => {
        const [detailsRes, creditsRes] = await Promise.all([
          axios.get(`${BASE_URL}/movie/${movie.id}`, {
            params: { api_key: API_KEY, language: 'en-US' },
          }),
          axios.get(`${BASE_URL}/movie/${movie.id}/credits`, {
            params: { api_key: API_KEY, language: 'en-US' },
          }),
        ]);

        const details = detailsRes.data;
        const credits = creditsRes.data;
        const director = credits.crew.find((member) => member.job === 'Director');
        const topCast = credits.cast.slice(0, 5).map((actor) => ({
          name: actor.name,
          profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null,
        }));

        return {
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
          banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
          releaseYear: details.release_date ? details.release_date.split('-')[0] : 'N/A',
          genres: details.genres.map((g) => g.name),
          rating: details.vote_average,
          director: director ? director.name : 'Unknown',
          cast: topCast,
        };
      })
    );

    res.json(detailedMovies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Failed to fetch movies' });
  }
};

exports.movieDetails = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid movie ID' });
  }

  try {
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      axios.get(`${BASE_URL}/movie/${id}`, {
        params: { api_key: API_KEY, language: 'en-US' },
      }),
      axios.get(`${BASE_URL}/movie/${id}/credits`, {
        params: { api_key: API_KEY, language: 'en-US' },
      }),
      axios.get(`${BASE_URL}/movie/${id}/videos`, {
        params: { api_key: API_KEY, language: 'en-US' },
      }),
    ]);

    const details = detailsRes.data;
    const credits = creditsRes.data;
    const videos = videosRes.data.results;

    const director = credits.crew.find((member) => member.job === 'Director');
    const cast = credits.cast.slice(0, 10).map((actor) => ({
      id: actor.id,
      name: actor.name,
      character: actor.character,
      profile: actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : null,
    }));

    const trailer = videos.find((video) => video.type === 'Trailer' && video.site === 'YouTube');

    const movieDetails = {
      id: details.id,
      title: details.title,
      overview: details.overview,
      poster: details.poster_path ? `${IMAGE_URL}${details.poster_path}` : null,
      banner: details.backdrop_path ? `${IMAGE_URL}${details.backdrop_path}` : null,
      releaseYear: details.release_date ? details.release_date.split('-')[0] : 'N/A',
      genres: details.genres.map((g) => g.name),
      rating: details.vote_average,
      runtime: details.runtime,
      director: director ? director.name : 'Unknown',
      cast,
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      budget: details.budget,
      revenue: details.revenue,
      tagline: details.tagline,
    };

    res.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'Failed to fetch movie details' });
  }
};

exports.trending = async (req, res) => {
  const genreMap = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  };

  try {
    const response = await axios.get(`${BASE_URL}/trending/movie/week`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        page: 1,
      },
    });

    const movies = (response.data.results || []).map((movie) => ({
      id: movie.id,
      title: movie.title,
      banner: movie.backdrop_path ? `${IMAGE_URL}${movie.backdrop_path}` : null,
      poster: movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : null,
      genres: movie.genre_ids.map((id) => genreMap[id] || 'Unknown'),
      rating: movie.vote_average || 0,
      releaseYear: movie.release_date?.split('-')[0] || 'N/A',
    }));

    res.json(movies);
  } catch (error) {
    console.error('TMDB fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
};

exports.cast = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ message: 'Invalid cast ID' });
  }

  try {
    const response = await axios.get(`${BASE_URL}/person/${id}`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
      },
    });

    const data = response.data;

    const castDetails = {
      id: data.id,
      name: data.name,
      biography: data.biography,
      birthday: data.birthday,
      deathday: data.deathday,
      gender: data.gender === 1 ? 'Female' : data.gender === 2 ? 'Male' : 'Other',
      knownFor: data.known_for_department,
      placeOfBirth: data.place_of_birth,
      popularity: data.popularity,
      profile: data.profile_path ? `${IMAGE_URL}${data.profile_path}` : null,
      homepage: data.homepage || null,
    };

    res.json(castDetails);
  } catch (error) {
    console.error('Error fetching cast details:', error);
    res.status(500).json({ message: 'Failed to fetch cast details' });
  }
};

exports.series=async(req,res)=>{
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/popular?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching series:', error.message);
    res.status(500).json({ msg: 'Error fetching series' });
  }
}

exports.upcoming=async(req,res)=>{
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching upcoming movies:', error.message);
    res.status(500).json({ msg: 'Error fetching upcoming movies' });
  }
}

exports.toprated=async(req,res)=>{
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching top-rated movies:', error.message);
    res.status(500).json({ msg: 'Error fetching top-rated movies' });
  }
}

exports.genre = async(req,res)=>{
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${req.params.genreId}&language=en-US`
    );
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching genre movies:', error.message);
    res.status(500).json({ msg: 'Error fetching genre movies' });
  }
}

exports.genres = async (req, res) => {
  try {
    const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
      params: {
        api_key: process.env.TMDB_API_KEY,
        language: 'en-US',
      },
    });
    console.log(response.data.genres);
    

    res.json(response.data.genres);
  } catch (error) {
    console.error('Error fetching genres:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Error fetching genres' });
  }
};

exports.genreslist=async(req,res)=>{
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        with_genres: req.params.genreId,
        language: 'en-US',
        sort_by: 'popularity.desc',
      },
    });
    console.log('Genre Movies:', response.data.results); // Debug
    res.json(response.data.results); // Return array
  } catch (error) {
    console.error('Error fetching genre movies:', error.response?.data || error.message);
    res.status(500).json({ msg: 'Error fetching genre movies' });
  }
}
