import {
  getPhotosMeta,
  getUniqueCameras,
  getUniqueFilms,
  getUniqueFocalLengths,
  getUniqueLenses,
  getUniqueRecipes,
  getUniqueTags,
  getPhotosInNeedOfUpdateCount,
} from '@/photo/query';
import AdminAppInsightsClient from './AdminAppInsightsClient';
import { getAllInsights, getGitHubMetaForCurrentApp } from '.';
import { USED_DEPRECATED_ENV_VARS } from '@/app/config';
import type { Cameras } from '@/camera';
import type { Lenses } from '@/lens';
import type { Tags } from '@/tag';
import type { Recipes } from '@/recipe';
import type { Films } from '@/film';
import type { FocalLengths } from '@/focal';

export default async function AdminAppInsights() {
  const [
    { count: photosCount, dateRange },
    { count: photosCountHidden },
    photosCountNeedSync,
    { count: photosCountPortrait },
    codeMeta,
    cameras,
    lenses,
    tags,
    recipes,
    films,
    focalLengths,
  ] = await Promise.all([
    getPhotosMeta({ hidden: 'include' }),
    getPhotosMeta({ hidden: 'only' }),
    (getPhotosInNeedOfUpdateCount() as Promise<number>),
    getPhotosMeta({ maximumAspectRatio: 0.9 }),
    getGitHubMetaForCurrentApp(),
    (getUniqueCameras() as Promise<Cameras>),
    (getUniqueLenses() as Promise<Lenses>),
    (getUniqueTags() as Promise<Tags>),
    (getUniqueRecipes() as Promise<Recipes>),
    (getUniqueFilms() as Promise<Films>),
    (getUniqueFocalLengths() as Promise<FocalLengths>),
  ]);

  return (
    <AdminAppInsightsClient
      codeMeta={codeMeta}
      insights={getAllInsights({
        codeMeta,
        photosCount,
        photosCountNeedSync,
        photosCountPortrait,
      })}
      usedDeprecatedEnvVars={USED_DEPRECATED_ENV_VARS}
      photoStats={{
        photosCount,
        photosCountHidden,
        photosCountNeedSync,
        camerasCount: cameras.length,
        lensesCount: lenses.length,
        tagsCount: tags.length,
        recipesCount: recipes.length,
        filmsCount: films.length,
        focalLengthsCount: focalLengths.length,
        dateRange,
      }}
    />
  );
}
