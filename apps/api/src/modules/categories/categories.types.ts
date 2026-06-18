import type {
  CategoryMutationResponse,
  PublicListCategoriesResponse,
} from '@kichulbot/api-contract/taxonomy';

export type AdminCategoryItem = CategoryMutationResponse['category'];
export type CategoryItem = PublicListCategoriesResponse['categories'][number];
