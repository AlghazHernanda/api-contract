import { describe, it, expect } from 'vitest';
import { modifyMovieResponse } from './movieController';

const themoviedbMovieDetail = {
  id: 550,
  title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac...',
  release_date: '1999-10-15',
  poster_path: '/poster.jpg',
  budget: 63000000,
  revenue: 100853753,
  vote_average: 8.4,
  backdrop_path: '/backdrop.jpg',
  homepage: 'https://example.com',
  tagline: 'Mischief. Mayhem. Soap.',
  status: 'Released'
};

describe('modifyMovieResponse', () => {
  it('menyertakan vote_average dari response TheMovieDB', () => {
    const result = modifyMovieResponse(themoviedbMovieDetail);

    expect(result.vote_average).toBe(8.4);
  });

  it('mempertahankan field detail lain tanpa menambahkan field asing', () => {
    const result = modifyMovieResponse(themoviedbMovieDetail);

    expect(result).toEqual({
      id: 550,
      title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac...',
      release_date: '1999-10-15',
      poster_path: '/poster.jpg',
      budget: 63000000,
      revenue: 100853753,
      vote_average: 8.4,
      backdrop_path: '/backdrop.jpg',
      homepage: 'https://example.com',
      tagline: 'Mischief. Mayhem. Soap.'
    });
  });

  it('memetakan vote_average 0 sebagai 0', () => {
    const result = modifyMovieResponse({ ...themoviedbMovieDetail, vote_average: 0 });

    expect(result.vote_average).toBe(0);
  });
});
