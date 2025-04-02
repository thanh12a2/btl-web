import { executeQuery } from "../config/db.js";

export const categoryController = {
  getCategoriesTitle: async () => {
    try {
      const query = `SELECT * FROM [dbo].[Category]`;
      const result = await executeQuery(query, [], [], false);

      if (result && result.recordset) {
        const buildCategoryTree = (categories, parentId = null) => {
          return categories
            .filter((category) => category.id_parent === parentId)
            .map((category) => ({
              id: category.id_category,
              name: category.category_name,
              children: buildCategoryTree(categories, category.id_category),
            }));
        };

        const categories = buildCategoryTree(result.recordset);
        return categories;
      }
      return [];
    } catch (error) {
      console.error("Error in getCategoriesTitle:", error);
      return [];
    }
  },
};
