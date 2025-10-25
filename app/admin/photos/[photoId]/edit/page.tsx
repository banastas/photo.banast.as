import { redirect } from 'next/navigation';
import {
  getPhotoNoStore,
  getUniqueFilmsCached,
  getUniqueRecipesCached,
  getUniqueTagsCached,
} from '@/photo/cache';
import { PATH_ADMIN } from '@/app/path';
import PhotoEditPageClient from '@/photo/PhotoEditPageClient';
import {
  AI_CONTENT_GENERATION_ENABLED,
  BLUR_ENABLED,
  IS_PREVIEW,
} from '@/app/config';
import { blurImageFromUrl, resizeImageFromUrl } from '@/photo/server';
import {
  getOptimizedPhotoUrlForManipulation,
  getStorageUrlsForPhoto,
} from '@/photo/storage';
import { getAlbumsWithMeta, getAlbumTitlesForPhoto } from '@/album/query';
import type { Albums } from '@/album';
import type { Tags } from '@/tag';
import type { Recipes } from '@/recipe';
import type { Films } from '@/film';

export default async function PhotoEditPage({
  params,
}: {
  params: Promise<{ photoId: string }>
}) {
  const { photoId } = await params;

  const [
    photo,
    photoAlbumTitles,
    albums,
    uniqueTags,
    uniqueRecipes,
    uniqueFilms,
  ] = await Promise.all([
    getPhotoNoStore(photoId, true),
    getAlbumTitlesForPhoto(photoId) as Promise<string[]>,
    getAlbumsWithMeta() as Promise<Albums>,
    getUniqueTagsCached() as Promise<Tags>,
    getUniqueRecipesCached() as Promise<Recipes>,
    getUniqueFilmsCached() as Promise<Films>,
  ]);

  if (!photo) { redirect(PATH_ADMIN); }

  const photoStorageUrls = await getStorageUrlsForPhoto(photo);

  const hasAiTextGeneration = AI_CONTENT_GENERATION_ENABLED;
  
  // Only generate image thumbnails when AI generation is enabled
  const imageThumbnailBase64 = AI_CONTENT_GENERATION_ENABLED
    ? await resizeImageFromUrl(
      getOptimizedPhotoUrlForManipulation(photo.url, IS_PREVIEW),
    )
    : '';

  const blurData = BLUR_ENABLED
    ? await blurImageFromUrl(
      getOptimizedPhotoUrlForManipulation(photo.url, IS_PREVIEW),
    )
    : '';

  return (
    <PhotoEditPageClient {...{
      photo,
      photoStorageUrls,
      photoAlbumTitles,
      albums,
      uniqueTags,
      uniqueRecipes,
      uniqueFilms,
      hasAiTextGeneration,
      imageThumbnailBase64,
      blurData,
    }} />
  );
};
