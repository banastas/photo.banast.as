import { getStorageUploadUrlsNoStore } from '@/platforms/storage/cache';
import {
  getPhotosMetaCached,
  getPhotosMostRecentUpdateCached,
  getUniqueRecipesCached,
  getUniqueTagsCached,
} from '@/photo/cache';
import {
  PATH_ADMIN_ALBUMS,
  PATH_ADMIN_PHOTOS,
  PATH_ADMIN_RECIPES,
  PATH_ADMIN_TAGS,
  PATH_ADMIN_UPLOADS,
} from '@/app/path';
import AdminNavClient from './AdminNavClient';
import { getAppText } from '@/i18n/state/server';
import { getAlbumsWithMeta } from '@/album/query';
import type { Albums } from '@/album';
import type { Tags } from '@/tag';
import type { Recipes } from '@/recipe';

export default async function AdminNav() {
  const [
    countPhotos,
    countUploads,
    countAlbums,
    countTags,
    countRecipes,
    mostRecentPhotoUpdateTime,
  ] = await Promise.all([
    getPhotosMetaCached({ hidden: 'include' })
      .then(({ count }) => count)
      .catch(() => 0),
    getStorageUploadUrlsNoStore()
      .then(urls => urls.length)
      .catch(e => {
        console.error(`Error getting blob upload urls: ${e}`);
        return 0;
      }),
    (getAlbumsWithMeta() as Promise<Albums>)
      .then(albums => albums.length)
      .catch(() => 0),
    (getUniqueTagsCached() as Promise<Tags>)
      .then(tags => tags.length)
      .catch(() => 0),
    (getUniqueRecipesCached() as Promise<Recipes>)
      .then(recipes => recipes.length)
      .catch(() => 0),
    (getPhotosMostRecentUpdateCached() as Promise<Date | undefined>)
      .catch(() => undefined),
  ]);

  const appText = await getAppText();

  const includeInsights = countPhotos > 0;

  // Photos
  const items = [{
    label: appText.photo.photoPlural,
    href: PATH_ADMIN_PHOTOS,
    count: countPhotos,
  }];

  // Uploads
  if (countUploads > 0) { items.push({
    label: appText.admin.uploadPlural,
    href: PATH_ADMIN_UPLOADS,
    count: countUploads,
  }); }

  // Albums
  if (countAlbums > 0) { items.push({
    label: appText.category.albumPlural,
    href: PATH_ADMIN_ALBUMS,
    count: countAlbums,
  }); }

  // Tags
  if (countTags > 0) { items.push({
    label: appText.category.tagPlural,
    href: PATH_ADMIN_TAGS,
    count: countTags,
  }); }

  // Recipes
  if (countRecipes > 0) { items.push({
    label: appText.category.recipePlural,
    href: PATH_ADMIN_RECIPES,
    count: countRecipes,
  }); }

  return (
    <AdminNavClient {...{
      items,
      mostRecentPhotoUpdateTime,
      includeInsights,
    }} />
  );
}
