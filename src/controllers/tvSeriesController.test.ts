import { describe, it, expect } from 'vitest';
import { modifyTvSeriesDetailResponse } from './tvSeriesController';

const themoviedbTvSeriesDetail = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Seven noble families fight for control...',
  first_air_date: '2011-04-17',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  vote_average: 8.4,
  homepage: 'https://example.com',
  tagline: 'Winter Is Coming.',
  status: 'Ended'
};

describe('modifyTvSeriesDetailResponse', () => {
  it('menyertakan vote_average dari response TheMovieDB', () => {
    const result = modifyTvSeriesDetailResponse(themoviedbTvSeriesDetail);

    expect(result.vote_average).toBe(8.4);
  });

  it('mempertahankan field detail lain tanpa menambahkan field asing', () => {
    const result = modifyTvSeriesDetailResponse(themoviedbTvSeriesDetail);

    expect(result).toEqual({
      id: 1399,
      name: 'Game of Thrones',
      overview: 'Seven noble families fight for control...',
      first_air_date: '2011-04-17',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      vote_average: 8.4,
      homepage: 'https://example.com',
      tagline: 'Winter Is Coming.'
    });
  });

  it('memetakan vote_average 0 sebagai 0', () => {
    const result = modifyTvSeriesDetailResponse({ ...themoviedbTvSeriesDetail, vote_average: 0 });

    expect(result.vote_average).toBe(0);
  });
});
