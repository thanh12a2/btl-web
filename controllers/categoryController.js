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

  deleteCategory: async (req, res) => {
    try {
        // Log để debug
        console.log("Deleting category with ID:", req.params.id);
        
        // Kiểm tra xem danh mục có tồn tại không
        const checkCategoryQuery = `
            SELECT * FROM [dbo].[Category]
            WHERE id_category = @id_category
        `;
        const categoryResult = await executeQuery(checkCategoryQuery, [req.params.id], ["id_category"], false);
        
        if (!categoryResult || !categoryResult.recordset || categoryResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy danh mục" });
        }

        // Lấy tất cả danh mục con (bao gồm cả danh mục con của danh mục con)
        const getAllChildCategories = async (parentId) => {
            const getChildrenQuery = `
                WITH CategoryHierarchy AS (
                    -- Danh mục gốc
                    SELECT id_category, id_parent
                    FROM [dbo].[Category]
                    WHERE id_category = @parentId
                    
                    UNION ALL
                    
                    -- Các danh mục con
                    SELECT c.id_category, c.id_parent
                    FROM [dbo].[Category] c
                    INNER JOIN CategoryHierarchy ch ON c.id_parent = ch.id_category
                )
                SELECT id_category FROM CategoryHierarchy
            `;
            const result = await executeQuery(getChildrenQuery, [parentId], ["parentId"], false);
            return result.recordset.map(cat => cat.id_category);
        };

        // Lấy tất cả ID danh mục cần xóa
        const categoriesToDelete = await getAllChildCategories(req.params.id);
        
        // Cập nhật các bài viết liên quan đến các danh mục này
        const updateArticlesQuery = `
            UPDATE [dbo].[Article]
            SET id_category = NULL
            WHERE id_category IN (${categoriesToDelete.map(id => `'${id}'`).join(',')})
        `;
        await executeQuery(updateArticlesQuery, [], [], false);
        
        // Xóa tất cả các danh mục
        const deleteCategoryQuery = `
            DELETE FROM [dbo].[Category]
            WHERE id_category IN (${categoriesToDelete.map(id => `'${id}'`).join(',')})
        `;
        const deleteResult = await executeQuery(deleteCategoryQuery, [], [], false);
        
        if (deleteResult.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "Không tìm thấy danh mục để xóa" });
        }

        console.log("Categories deleted successfully");
        res.redirect('back');
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Không thành công", details: error.message });
    }
  },

  addCategory: async (req, res) => {
    try {
      const { category_name, alias_name, id_parent } = req.body;

      console.log("Dữ liệu nhận được:", req.body);

      if (!category_name || !alias_name) {
        return res.status(400).json({ failed: "Vui lòng nhập đầy đủ tên danh mục và tên alias" });
      }

      const checkAliasQuery = `
        SELECT COUNT(*) as count
        FROM [dbo].[Category]
        WHERE alias_name = @alias_name
      `;
      const aliasResult = await executeQuery(checkAliasQuery, [alias_name], ["alias_name"], false);
      
      if (aliasResult.recordset[0].count > 0) {
        return res.status(400).json({ failed: "Tên alias đã tồn tại" });
      }

      if (id_parent && id_parent !== '') {
        const checkParentQuery = `
          SELECT COUNT(*) as count
          FROM [dbo].[Category]
          WHERE id_category = @id_parent
        `;
        const parentResult = await executeQuery(checkParentQuery, [id_parent], ["id_parent"], false);
        
        if (parentResult.recordset[0].count === 0) {
          return res.status(404).json({ failed: "Không tìm thấy danh mục cha" });
        }
      }

      const getMaxIdQuery = `
        SELECT TOP 1 id_category
        FROM [dbo].[Category]
        WHERE id_category LIKE 'C%'
        ORDER BY id_category DESC
      `;
      
      const maxIdResult = await executeQuery(getMaxIdQuery, [], [], false);
      
      let newIdNumber = 1;
      if (maxIdResult.recordset.length > 0) {
        const maxId = maxIdResult.recordset[0].id_category;
        const currentNumber = parseInt(maxId.substring(1), 10);
        newIdNumber = currentNumber + 1;
      }
      
      const id_category = 'C' + newIdNumber.toString().padStart(3, '0');
      
      const checkIdQuery = `
        SELECT COUNT(*) as count
        FROM [dbo].[Category]
        WHERE id_category = @id_category
      `;
      const idResult = await executeQuery(checkIdQuery, [id_category], ["id_category"], false);
      
      if (idResult.recordset[0].count > 0) {
        return res.status(400).json({ failed: "ID danh mục đã tồn tại. Vui lòng thử lại." });
      }
      
      const insertQuery = `
        INSERT INTO [dbo].[Category] (id_category, category_name, alias_name, id_parent)
        VALUES (@id_category, @category_name, @alias_name, @id_parent)
      `;
      
      const parentValue = id_parent && id_parent !== '' ? id_parent : null;
      
      await executeQuery(insertQuery, 
        [id_category, category_name, alias_name, parentValue], 
        ["id_category", "category_name", "alias_name", "id_parent"], 
        false
      );
      
      console.log("Danh mục đã được thêm với ID:", id_category);
      
      res.redirect('back');

    } catch (error) {
      console.error("Lỗi khi thêm danh mục:", error);
      res.status(500).json({ failed: "Thêm danh mục không thành công", error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
        const { id_category, category_name, alias_name, id_parent } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!id_category) {
            return res.status(400).json({ error: "Thiếu ID danh mục" });
        }

        if (!category_name || !alias_name) {
            return res.status(400).json({ error: "Thiếu thông tin danh mục" });
        }

        // Kiểm tra xem danh mục có tồn tại không
        const checkCategoryQuery = `
            SELECT * FROM [dbo].[Category]
            WHERE id_category = @id_category
        `;
        const categoryResult = await executeQuery(checkCategoryQuery, [id_category], ["id_category"], false);
        
        if (!categoryResult || !categoryResult.recordset || categoryResult.recordset.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy danh mục" });
        }

        // Kiểm tra xem danh mục cha có tồn tại không (nếu có)
        if (id_parent && id_parent !== '') {
            const checkParentQuery = `
                SELECT * FROM [dbo].[Category]
                WHERE id_category = @id_parent
            `;
            const parentResult = await executeQuery(checkParentQuery, [id_parent], ["id_parent"], false);
            
            if (!parentResult || !parentResult.recordset || parentResult.recordset.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy danh mục cha" });
            }

            // Kiểm tra xem danh mục cha có phải là danh mục con của danh mục hiện tại không
            const checkCircularQuery = `
                WITH CategoryHierarchy AS (
                    -- Danh mục gốc
                    SELECT id_category, id_parent
                    FROM [dbo].[Category]
                    WHERE id_category = @id_category
                    
                    UNION ALL
                    
                    -- Các danh mục con
                    SELECT c.id_category, c.id_parent
                    FROM [dbo].[Category] c
                    INNER JOIN CategoryHierarchy ch ON c.id_parent = ch.id_category
                )
                SELECT COUNT(*) as count
                FROM CategoryHierarchy
                WHERE id_category = @id_parent
            `;
            const circularResult = await executeQuery(checkCircularQuery, [id_category, id_parent], ["id_category", "id_parent"], false);
            
            if (circularResult.recordset[0].count > 0) {
                return res.status(400).json({ error: "Không thể chọn danh mục con làm danh mục cha" });
            }
        }

        // Cập nhật danh mục (xử lý id_parent là null/rỗng)
        const parentValue = id_parent && id_parent !== '' ? id_parent : null;

        const updateQuery = `
            UPDATE [dbo].[Category]
            SET category_name = @category_name,
                alias_name = @alias_name,
                id_parent = @id_parent
            WHERE id_category = @id_category
        `;
        await executeQuery(updateQuery, [category_name, alias_name, parentValue, id_category], 
            ["category_name", "alias_name", "id_parent", "id_category"], false);

        // Thay vì trả về JSON, chuyển hướng người dùng về trang trước đó
        res.redirect('back');
    } catch (error) {
        console.error("Lỗi khi cập nhật danh mục:", error);
        res.status(500).json({
            error: "Cập nhật danh mục không thành công",
            details: error.message
        });
    }
  },

};




