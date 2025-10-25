import AdminPhotosUpdateClient from '@/admin/AdminPhotosUpdateClient';
import { AI_CONTENT_GENERATION_ENABLED } from '@/app/config';
import { getPhotosInNeedOfUpdate } from '@/photo/query';
import type { Photo } from '@/photo';

export const maxDuration = 60;

export default async function AdminUpdatesPage() {
  const photos = await (getPhotosInNeedOfUpdate() as Promise<Photo[]>)
    .catch(() => []);

  return (
    <AdminPhotosUpdateClient {...{
      photos,
      hasAiTextGeneration: AI_CONTENT_GENERATION_ENABLED,
    }} />
  );
}
