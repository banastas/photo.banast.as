import AdminRecipeTable from '@/admin/AdminRecipeTable';
import AppGrid from '@/components/AppGrid';
import { getUniqueRecipes } from '@/photo/query';
import type { Recipes } from '@/recipe';

export default async function AdminRecipesPage() {
  const recipes = await (getUniqueRecipes() as Promise<Recipes>)
    .catch(() => []);

  return (
    <AppGrid
      contentMain={
        <div className="space-y-6">
          <div className="space-y-4">
            <AdminRecipeTable {...{ recipes }} />
          </div>
        </div>}
    />
  );
}
