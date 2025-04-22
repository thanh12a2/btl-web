// CrudController.js
import sql from 'mssql';
import config from '../config/db.js';

const generateNewArticleId = async () => {
  const pool = await sql.connect(config);
  
  // Lấy ID lớn nhất hiện có
  const result = await pool.request()
    .query('SELECT TOP 1 id_article FROM [dbo].[Article] ORDER BY id_article DESC');
  
  let lastId = "A000"; // Giá trị mặc định nếu bảng trống
  
  if (result.recordset.length > 0) {
    lastId = result.recordset[0].id_article;
  }
  
  // Tách số và tăng giá trị
  const numericPart = parseInt(lastId.substring(1)) + 1;
  const newId = `A${numericPart.toString().padStart(3, '0')}`; // Định dạng A001, A002,...
  
  return newId;
};


// CREATE operation
const insertArticle = async (req, res) => {
  try {
    const { user, category_name, heading, hero_image, content, name_alias, is_featured } = req.body;

    let pool = await sql.connect(config);
    const newId = await generateNewArticleId();
    // Lookup userId
    const userResult = await pool.request()
      .input('username', sql.NVarChar, user)
      .query('SELECT id_user FROM [dbo].[User] WHERE username = @username');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const userId = userResult.recordset[0].id_user;
    
    // Lookup categoryId
    const categoryResult = await pool.request()
      .input('categoryName', sql.NVarChar, category_name)
      .query('SELECT id_category FROM [dbo].[Category] WHERE category_name = @categoryName');

    if (categoryResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Category not found' });
    }
    const categoryId = categoryResult.recordset[0].id_category;
    const status = "Đã duyệt";

    const isFeaturedValue = is_featured === 'Có' ? 1 : 0;
    // Thực hiện cập nhật
    await pool.request()
      .input('id_article', sql.VarChar, newId)
      .input('id_user', sql.VarChar, userId)
      .input('id_category', sql.VarChar, categoryId)
      .input('heading', sql.NVarChar, heading)
      .input('hero_image', sql.NVarChar, hero_image)
      .input('content', sql.NVarChar, content)
      .input('name_alias', sql.NVarChar, name_alias)
      .input('is_featured', sql.Bit, isFeaturedValue)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO [dbo].[Article] (
          id_article, id_user, id_category, heading, hero_image, content, name_alias, status, is_featured, day_created
        )
        VALUES (
          @id_article, @id_user, @id_category, @heading, @hero_image, @content, @name_alias, @status, @is_featured, GETDATE()
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

    res.json({
      success: true,
      message: 'Item created successfully',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE operation
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, category_name, heading, hero_image, content, name_alias, view, likes, is_featured } = req.body;

    let pool = await sql.connect(config);

    // Lookup userId
    const userResult = await pool.request()
      .input('username', sql.NVarChar, user)
      .query('SELECT id_user FROM [dbo].[User] WHERE username = @username');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const userId = userResult.recordset[0].id_user;
    const isFeaturedValue = is_featured === 'true' ? 1 : 0;
    // Lookup categoryId
    const categoryResult = await pool.request()
      .input('categoryName', sql.NVarChar, category_name)
      .query('SELECT id_category FROM [dbo].[Category] WHERE category_name = @categoryName');

    if (categoryResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Category not found' });
    }
    const categoryId = categoryResult.recordset[0].id_category;

    // Kiểm tra tồn tại bài viết
    const checkResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .query('SELECT id_article FROM [dbo].[Article] WHERE id_article = @id_article');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    
    // Thực hiện cập nhật
    await pool.request()
      .input('id_article', sql.VarChar, id)
      .input('id_user', sql.VarChar, userId)
      .input('id_category', sql.VarChar, categoryId)
      .input('heading', sql.NVarChar, heading)
      .input('hero_image', sql.NVarChar, hero_image)
      .input('content', sql.NVarChar, content)
      .input('name_alias', sql.NVarChar, name_alias)
      .input('views', sql.Int, view)
      .input('like_count', sql.Int, likes)
      .input('is_featured', sql.Bit, isFeaturedValue)
      .query(`
        UPDATE [dbo].[Article]
        SET 
          id_user = @id_user,
          id_category = @id_category,
          heading = @heading,
          hero_image = @hero_image,
          content = @content,
          name_alias = @name_alias,
          views = @views,
          like_count = @like_count,
          is_featured = @is_featured,
          day_created = GETDATE()
        WHERE 
          id_article = @id_article
      `);

    res.json({
      success: true,
      message: 'Item updated successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing article ID" }); // Thiếu ID
    }

    const pool = await sql.connect(config);
    const checkResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .query('SELECT id_article FROM [dbo].[Article] WHERE id_article = @id_article');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ error: "Article not found" }); // JSON thay vì HTML
    }

    await pool.request()
      .input('id_article', sql.VarChar, id)
      .query('DELETE FROM [dbo].[Article] WHERE id_article = @id_article');

    res.json({ success: true, message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message }); // Luôn trả về JSON
  }
};

export {
  insertArticle,
  updateArticle,
  deleteArticle
};