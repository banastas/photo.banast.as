import {
  getPhotosMeta,
  getUniqueCameras,
  getUniqueFilms,
  getUniqueFocalLengths,
  getUniqueLenses,
  getUniqueRecipes,
  getUniqueTags,
  getUniqueYears,
} from '@/photo/query';
import {
  SHOW_FILMS,
  SHOW_FOCAL_LENGTHS,
  SHOW_LENSES,
  SHOW_RECIPES,
  SHOW_CAMERAS,
  SHOW_TAGS,
  SHOW_YEARS,
  SHOW_RECENTS,
  SHOW_ALBUMS,
} from '@/app/config';
import { createLensKey, type Lenses } from '@/lens';
import { sortTagsByCount, type Tags } from '@/tag';
import { sortCategoriesByCount } from '@/category';
import { sortFocalLengths, type FocalLengths } from '@/focal';
import { getAlbumsWithMeta } from '@/album/query';
import type { Albums } from '@/album';
import type { Years } from '@/year';
import type { Cameras } from '@/camera';
import type { Recipes } from '@/recipe';
import type { Films } from '@/film';

type CategoryData = Awaited<ReturnType<typeof getDataForCategories>>;

export const NULL_CATEGORY_DATA: CategoryData = {
  recents: [],
  years: [],
  cameras: [],
  lenses: [],
  tags: [],
  recipes: [],
  films: [],
  focalLengths: [],
  albums: [],
};

export const getDataForCategories = () => Promise.all([
  SHOW_RECENTS
    ? getPhotosMeta({ recent: true })
      .then(({ count, dateRange }) => count && dateRange
        ? [{
          count,
          lastModified: new Date(dateRange?.end ?? ''),
        }] : undefined)
      .catch(() => [])
    : undefined,
  SHOW_YEARS
    ? (getUniqueYears() as Promise<Years>)
      .catch(() => [])
    : undefined,
  SHOW_CAMERAS
    ? (getUniqueCameras() as Promise<Cameras>)
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
  SHOW_LENSES
    ? (getUniqueLenses() as Promise<Lenses>)
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
  SHOW_TAGS
    ? (getUniqueTags() as Promise<Tags>)
      .then(sortTagsByCount)
      .catch(() => [])
    : undefined,
  SHOW_RECIPES
    ? (getUniqueRecipes() as Promise<Recipes>)
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
  SHOW_FILMS
    ? (getUniqueFilms() as Promise<Films>)
      .then(sortCategoriesByCount)
      .catch(() => [])
    : undefined,
  SHOW_FOCAL_LENGTHS
    ? (getUniqueFocalLengths() as Promise<FocalLengths>)
      .then(sortFocalLengths)
      .catch(() => [])
    : undefined,
  SHOW_ALBUMS
    ? (getAlbumsWithMeta() as Promise<Albums>)
      .catch(() => [])
    : undefined,
]).then(([
  recents = [],
  years = [],
  cameras = [],
  lenses = [],
  tags = [],
  recipes = [],
  films = [],
  focalLengths = [],
  albums = [],
]) => ({
  recents,
  years,
  cameras,
  lenses,
  tags,
  recipes,
  films,
  focalLengths,
  albums,
}));

export const getCountsForCategories = async () => {
  const {
    recents,
    years,
    cameras,
    lenses,
    albums,
    tags,
    recipes,
    films,
    focalLengths,
  } = await getDataForCategories();

  return {
    recents: recents[0]?.count
      ? { count: recents[0].count }
      : {} as Record<string, number>,
    years: years.reduce((acc, year) => {
      acc[year.year] = year.count;
      return acc;
    }, {} as Record<string, number>),
    albums: albums.reduce((acc, { album, count }) => {
      acc[album.slug] = count;
      return acc;
    }, {} as Record<string, number>),
    cameras: cameras.reduce((acc, camera) => {
      acc[camera.cameraKey] = camera.count;
      return acc;
    }, {} as Record<string, number>),
    lenses: lenses.reduce((acc, lens) => {
      acc[createLensKey(lens.lens)] = lens.count;
      return acc;
    }, {} as Record<string, number>),
    tags: tags.reduce((acc, tag) => {
      acc[tag.tag] = tag.count;
      return acc;
    }, {} as Record<string, number>),
    recipes: recipes.reduce((acc, recipe) => {
      acc[recipe.recipe] = recipe.count;
      return acc;
    }, {} as Record<string, number>),
    films: films.reduce((acc, film) => {
      acc[film.film] = film.count;
      return acc;
    }, {} as Record<string, number>),
    focalLengths: focalLengths.reduce((acc, focalLength) => {
      acc[focalLength.focal] = focalLength.count;
      return acc;
    }, {} as Record<string, number>),
  };
};
