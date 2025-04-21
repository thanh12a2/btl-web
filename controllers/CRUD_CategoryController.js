import sql from 'mssql';
import config from '../config/db.js';

// Generate new category ID
const generateNewCateId = async () => {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
      .query('SELECT TOP 1 id_category FROM [dbo].[Category] ORDER BY id_category DESC');
    
    let newId = "C001"; // Default starting ID
    
    if (result.recordset.length > 0) {
      const lastId = result.recordset[0].id_category;
      const numericPart = parseInt(lastId.substring(1)) + 1;
      newId = `C${numericPart.toString().padStart(3, '0')}`;
    }
    
    return newId;
  } catch (err) {
    console.error('Error generating new category ID:', err);
    throw new Error('Failed to generate category ID');
  }
};

// CREATE operation - Chỉ cho phép tạo danh mục con, không cho tạo danh mục cha
const insertCate = async (req, res) => {
  try {
    const { category_name, id_parent } = req.body;

    // Validate input
    if (!category_name || typeof category_name !== 'string' || category_name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR', 
        message: 'Tên danh mục không được để trống' 
      });
    }

    // Validate id_parent
    if (!id_parent) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR', 
        message: 'Phải chọn danh mục cha' 
      });
    }

    const pool = await sql.connect(config);
    const newId = await generateNewCateId();

    // Check if category name already exists
    const nameCheck = await pool.request()
      .input('category_name', sql.NVarChar, category_name)
      .query('SELECT id_category FROM [dbo].[Category] WHERE category_name = @category_name');
    
    if (nameCheck.recordset.length > 0) {
      return res.status(400).json({ 
        error: 'DUPLICATE_CATEGORY', 
        message: 'Tên danh mục đã tồn tại' 
      });
    }

    // Check if parent category exists and is a root category
    const parentCheck = await pool.request()
      .input('id_parent', sql.VarChar, id_parent)
      .query('SELECT id_category, id_parent FROM [dbo].[Category] WHERE id_category = @id_parent');
    
    if (parentCheck.recordset.length === 0) {
      return res.status(400).json({ 
        error: 'PARENT_CATEGORY_NOT_FOUND', 
        message: 'Danh mục cha không tồn tại' 
      });
    }

    // Verify that parent is a root category (doesn't have its own parent)
    if (parentCheck.recordset[0].id_parent !== null) {
      return res.status(400).json({ 
        error: 'INVALID_PARENT', 
        message: 'Chỉ danh mục gốc mới có thể làm danh mục cha' 
      });
    }

    // Insert new category
    await pool.request()
      .input('id_category', sql.VarChar, newId)
      .input('category_name', sql.NVarChar, category_name.trim())
      .input('id_parent', sql.VarChar, id_parent)
      .query(`
        INSERT INTO [dbo].[Category] (
          id_category, category_name, id_parent
        )
        VALUES (
          @id_category, @category_name, @id_parent
        )
      `);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Thêm danh mục thành công',
      data: {
        id: newId,
        category_name: category_name.trim(),
        id_parent
      }
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Đã xảy ra lỗi khi tạo danh mục' 
    });
  }
};

// UPDATE operation - Nếu là danh mục cha (id_parent = null) thì chỉ được sửa tên
const updateCate = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, id_parent } = req.body;

    // Validate input
    if (!category_name || typeof category_name !== 'string' || category_name.trim().length === 0) {
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR', 
        message: 'Tên danh mục không được để trống' 
      });
    }

    const pool = await sql.connect(config);

    // Check if category exists
    const categoryCheck = await pool.request()
      .input('id_category', sql.VarChar, id)
      .query('SELECT id_category, id_parent FROM [dbo].[Category] WHERE id_category = @id_category');

    if (categoryCheck.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'CATEGORY_NOT_FOUND', 
        message: 'Danh mục không tồn tại' 
      });
    }

    const isRootCategory = categoryCheck.recordset[0].id_parent === null;

    // Check if name conflicts with existing categories
    const nameCheck = await pool.request()
      .input('category_name', sql.NVarChar, category_name)
      .input('id_category', sql.VarChar, id)
      .query('SELECT id_category FROM [dbo].[Category] WHERE category_name = @category_name AND id_category != @id_category');
    
    if (nameCheck.recordset.length > 0) {
      return res.status(400).json({ 
        error: 'DUPLICATE_CATEGORY', 
        message: 'Tên danh mục đã tồn tại' 
      });
    }

    // Different logic based on category type
    if (isRootCategory) {
      // Danh mục gốc: chỉ cập nhật tên, giữ nguyên id_parent là null
      await pool.request()
        .input('id_category', sql.VarChar, id)
        .input('category_name', sql.NVarChar, category_name.trim())
        .query(`
          UPDATE [dbo].[Category]
          SET category_name = @category_name
          WHERE id_category = @id_category
        `);
    } else {
      // Danh mục con: kiểm tra id_parent
      if (!id_parent) {
        return res.status(400).json({ 
          error: 'VALIDATION_ERROR', 
          message: 'Phải chọn danh mục cha' 
        });
      }

      // Check if parent category exists and is a root category
      const parentCheck = await pool.request()
        .input('id_parent', sql.VarChar, id_parent)
        .query('SELECT id_category, id_parent FROM [dbo].[Category] WHERE id_category = @id_parent');
      
      if (parentCheck.recordset.length === 0) {
        return res.status(400).json({ 
          error: 'PARENT_CATEGORY_NOT_FOUND', 
          message: 'Danh mục cha không tồn tại' 
        });
      }

      // Verify that new parent is a root category
      if (parentCheck.recordset[0].id_parent !== null) {
        return res.status(400).json({ 
          error: 'INVALID_PARENT', 
          message: 'Chỉ danh mục gốc mới có thể làm danh mục cha' 
        });
      }

      // Check for circular reference
      if (id_parent === id) {
        return res.status(400).json({ 
          error: 'CIRCULAR_REFERENCE', 
          message: 'Danh mục không thể là cha của chính nó' 
        });
      }

      // Update category with new name and id_parent
      await pool.request()
        .input('id_category', sql.VarChar, id)
        .input('category_name', sql.NVarChar, category_name.trim())
        .input('id_parent', sql.VarChar, id_parent)
        .query(`
          UPDATE [dbo].[Category]
          SET 
            category_name = @category_name,
            id_parent = @id_parent
          WHERE 
            id_category = @id_category
        `);
    }

    // Return success response
    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: {
        id,
        category_name: category_name.trim(),
        id_parent: isRootCategory ? null :       id_parent
      }
    });

  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Đã xảy ra lỗi khi cập nhật danh mục' 
    });
  }
};

// DELETE operation - Chỉ được xóa danh mục con, không được xóa danh mục cha
const deleteCate = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: "VALIDATION_ERROR", 
        message: "Thiếu ID danh mục" 
      });
    }

    const pool = await sql.connect(config);
    
    // Check if category exists
    const categoryCheck = await pool.request()
      .input('id_category', sql.VarChar, id)
      .query('SELECT id_category,  id_parent FROM [dbo].[Category] WHERE id_category = @id_category');
    if (categoryCheck.recordset.length === 0) {
      return res.status(404).json({ 
        error: 'CATEGORY_NOT_FOUND', 
        message: 'Danh mục không tồn tại' 
      });
    }

    // Check if category is a root category
    if (categoryCheck.recordset[0].id_parent === null) {
      return res.status(400).json({ 
        error: 'ROOT_CATEGORY', 
        message: 'Không thể xóa danh mục gốc' 
      });
    }

    // Check if category has children (sub-categories)
    const childrenCheck = await pool.request()
      .input(`id_parent`, sql.VarChar, id)
      .query('SELECT id_category FROM [dbo].[Category] WHERE id_parent = @id_parent');
    
    if (childrenCheck.recordset.length > 0) {
      return res.status(400).json({ 
        error: 'CATEGORY_HAS_CHILDREN', 
        message: 'Không thể xóa danh mục có chứa danh mục con' 
      });
    }

    // Check if category has articles
    const articlesCheck = await pool.request()
      .input('id_category', sql.VarChar, id)
      .query('SELECT id_article FROM [dbo].[Articles] WHERE id_category = @id_category');
    
    if (articlesCheck.recordset.length > 0) {
      return res.status(400).json({ 
        error: 'CATEGORY_HAS_ARTICLES', 
        message: 'Không thể xóa danh mục có chứa bài viết' 
      });
    }

    // Delete the category
    const deleteResult = await pool.request()
      .input('id_category', sql.VarChar, id)
      .query('DELETE FROM [dbo].[Category] WHERE id_category = @id_category');

    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ 
        error: 'CATEGORY_NOT_FOUND', 
        message: 'Danh mục không tồn tại' 
      });
    }

    // Return success response
    res.json({ 
      success: true, 
      message: "Xóa danh mục thành công" 
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Đã xảy ra lỗi khi xóa danh mục' 
    });
  }
};

// GET all categories with parent names
const getAllCategories = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
    // Use a JOIN to get parent category names
    const result = await pool.request().query(`
      SELECT 
        c.id_category, 
        c.category_name, 
        c.id_parent,
        c.alias_name,
        p.category_name AS parent_category_name
      FROM 
        [dbo].[Category] c
      LEFT JOIN 
        [dbo].[Category] p ON c.id_parent = p.id_category
      ORDER BY 
        CASE WHEN c.id_parent IS NULL THEN 0 ELSE 1 END,
        c.category_name
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: 'Đã xảy ra lỗi khi tải danh sách danh mục' 
    });
  }
};

export { insertCate, updateCate, deleteCate, getAllCategories };