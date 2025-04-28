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
              name_alias: category.alias_name,
              children: buildCategoryTree(categories, category.id_category),
            }));
        };

        const categories = buildCategoryTree(result.recordset);
        // console.log(categories)
        return categories;
      }
      return [];
    } catch (error) {
      console.error("Error in getCategoriesTitle:", error);
      return [];
    }
  },

  getCategoriesTitle1: async (req, res) => {
      const query = `SELECT * FROM [dbo].[Category]`;
      try {
        const result = await executeQuery(query, [], [], false);
  
        if (result && result.recordset) {
          const buildCategoryTree = (categories, parentId = null) => {
            return categories
              .filter((category) => category.id_parent === parentId)
              .map((category) => ({
                id: category.id_category,
                name: category.category_name,
                name_alias: category.alias_name,
                children: buildCategoryTree(categories, category.id_category),
              }));
          };
  
          const categories = buildCategoryTree(result.recordset);
          // console.log(categories)
          res.json({categories})
        }
        return [];
      } catch (error) {
        console.error("Error in getCategoriesTitle:", error);
        return [];
      }
    },
};
