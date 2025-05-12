// CrudController.js
import sql from 'mssql';
import config, { executeQuery } from '../config/db.js';

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
  const { nameArticle, dmChinh, dmPhu, hero_image, content } = req.body;
  console.log('Request body:', req.body);
  // Truy vấn kiểm tra người dùng
  const queryCheckUser = `SELECT * FROM [dbo].[User] WHERE email = @email`;

  // Tạo ID bài viết mới
  const articleId = await generateNewArticleId();

  // Truy vấn chèn bài viết
  const queryInsertArticle = `
    INSERT INTO [dbo].[Article] 
    (id_article, id_user, id_category, heading, hero_image, content, name_alias, views, like_count, status, is_featured, day_created)
    VALUES 
    (@id_article, @id_user, @id_category, @heading, @hero_image, @content, @name_alias, 0, 0, N'Chưa duyệt', 0, SYSDATETIMEOFFSET())
  `;

  try {
    // Lấy thông tin người dùng từ email
    const resultUser = await executeQuery(queryCheckUser, [res.locals.email], ['email'], false);

    if (resultUser.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Người dùng không hợp lệ' });
    }

    const user = resultUser.recordset[0];

    // Kiểm tra quyền của người dùng
    if (user.role !== "Admin" && user.role !== "NhaBao") {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thêm bài viết' });
    }

    // Xác định `id_category` dựa trên `dmPhu` hoặc `dmChinh`
    const idCategory = dmPhu || dmChinh;

    if (!idCategory) {
      return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ' });
    }

    // Tạo alias cho bài viết
    const nameAlias = nameArticle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Chèn bài viết vào cơ sở dữ liệu
    await executeQuery(
      queryInsertArticle,
      [articleId, user.id_user, idCategory, nameArticle, hero_image, content, nameAlias],
      ['id_article', 'id_user', 'id_category', 'heading', 'hero_image', 'content', 'name_alias'],
      false
    );

    res.status(201).json({ success: true, message: 'Thêm bài viết thành công' });
  } catch (error) {
    console.error('Lỗi khi thêm bài viết:', error);
    res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi thêm bài viết', error: error.message });
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

const updateArticleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Updating article ${id} status to: ${status}`);

    let pool = await sql.connect(config);

    // Kiểm tra tồn tại bài viết
    const checkResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .query('SELECT id_article FROM [dbo].[Article] WHERE id_article = @id_article');

    if (checkResult.recordset.length === 0) {
      console.log(`Article ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài viết' 
      });
    }

    // Cập nhật trạng thái
    const updateResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE [dbo].[Article] SET status = @status WHERE id_article = @id_article');
    
    console.log('Update completed:', updateResult);

    // Trả về kết quả ngay lập tức
    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (err) {
    console.error('Error updating article status:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra khi cập nhật trạng thái',
      error: err.message 
    });
  }
};

const updateArticleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    console.log(`Updating article ${id} featured status to: ${is_featured}`);

    let pool = await sql.connect(config);

    // Kiểm tra tồn tại bài viết
    const checkResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .query('SELECT id_article FROM [dbo].[Article] WHERE id_article = @id_article');

    if (checkResult.recordset.length === 0) {
      console.log(`Article ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy bài viết' 
      });
    }

    // Cập nhật trạng thái nổi bật
    const updateResult = await pool.request()
      .input('id_article', sql.VarChar, id)
      .input('is_featured', sql.Bit, is_featured)
      .query('UPDATE [dbo].[Article] SET is_featured = @is_featured WHERE id_article = @id_article');

    console.log('Update completed:', updateResult);

    // Trả về kết quả ngay lập tức
    res.json({
      success: true,
      message: 'Cập nhật trạng thái nổi bật thành công'
    });
  } catch (err) {
    console.error('Error updating article featured status:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Có lỗi xảy ra khi cập nhật trạng thái nổi bật',
      error: err.message 
    });
  }
};


export {
  insertArticle,
  updateArticle,
  deleteArticle,
  updateArticleStatus,
  updateArticleFeatured
};

