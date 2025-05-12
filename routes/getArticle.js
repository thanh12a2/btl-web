import express from 'express';
import { articleController } from '../controllers/articleController.js';
import { authController } from "../controllers/authController.js";
import { commentController } from '../controllers/commentController.js';
import { executeQuery } from "../config/db.js";
import dayjs from "dayjs";
import "dayjs/locale/vi.js";

const router = express.Router();

router.get("/getarticle", articleController.getArticles);

router.get("/transportArticle/:id", authController.authenticateToken, articleController.transportArticle);

router.post("/searchArticle", articleController.searchArticles);

router.get("/getArticlesOldest/:id", articleController.getArticlesOldest);

router.get("/likeArticle/:id", authController.authenticateToken, articleController.likeArticle);

router.post("/removeArticle/:id", authController.authenticateToken, articleController.removeLikedArticle);

router.get("/sortArticlesByLikes/:id", articleController.sortArticlesByLikesCount);

router.get("/sortArticlesByViews/:id", articleController.sortArticlesByViewsCount);

router.post("/comment/:id", authController.authenticateToken, commentController.commentParent);

router.get("/getOutstandingArticle", articleController.getOutstandingArticle);

router.post("/likeComment", authController.authenticateToken, commentController.likeComment);

router.delete("/unlikeComment", authController.authenticateToken, commentController.unlikeComment);

router.get("/getCommentByArticle/:id", authController.authenticateToken, commentController.getCommentByArticle);

router.get("/sortCommentLatest/:id", authController.authenticateToken, commentController.sortCommentLatest);

router.post("/commentChild/:id", authController.authenticateToken, commentController.commentChild);

router.post("/deleteArticle/:id", articleController.deleteArticle);

router.get(
  "/checkArticle/:id",
  authController.authenticateToken,
  async (req, res) => {
    const articleId = req.params.id;

    // Truy vấn bài viết
    const articleQuery = `SELECT * FROM [dbo].[Article] WHERE name_alias = @id`;
    const articleValues = [articleId];
    const articleParams = ["id"];

    // Truy vấn bình luận
    const commentQuery = `
        SELECT C.*, U.username
        FROM [dbo].[Comment] C
        JOIN [dbo].[User] U ON C.id_user = U.id_user
        WHERE C.id_article = (
            SELECT id_article 
            FROM [dbo].[Article] 
            WHERE name_alias = @name_alias
        )
        ORDER BY C.day_created ASC;
    `;
    const commentValues = [articleId];
    const commentParams = ["name_alias"];

    // Truy vấn danh mục
    const categoryQuery = `
        SELECT 
            pr.category_name AS parent_category, 
            ch.category_name AS child_category
        FROM 
            [dbo].[Category] ch
        LEFT JOIN 
            [dbo].[Category] pr ON ch.id_parent = pr.id_category
        WHERE 
            ch.id_category = @id_category;
    `;

    // Truy vấn người dùng
    const userQuery = `SELECT username FROM [dbo].[User] WHERE id_user = @id_user`;

    try {
      if (res.locals.role == "Admin") {
        // Lấy danh sách bình luận
        const commentsResult = await executeQuery(
          commentQuery,
          commentValues,
          commentParams,
          false
        );

        // Format `day_created` trong kết quả
        commentsResult.recordset.forEach((comment) => {
          comment.day_created = dayjs(comment.day_created).format(
            "dddd, D/M/YYYY, HH:mm"
          );
        });

        // Lấy thông tin bài viết
        const articleResult = await executeQuery(
          articleQuery,
          articleValues,
          articleParams,
          false
        );
        const article = articleResult.recordset[0];

        // Lấy thông tin danh mục
        const categoryValues = [article.id_category];
        const categoryParams = ["id_category"];
        const categoryResult = await executeQuery(
          categoryQuery,
          categoryValues,
          categoryParams,
          false
        );

        // Lấy thông tin người dùng
        const userValues = [article.id_user];
        const userParams = ["id_user"];
        const userResult = await executeQuery(
          userQuery,
          userValues,
          userParams,
          false
        );

        // Định dạng ngày
        const formattedDate = dayjs(article.day_created).format(
          "dddd, D/M/YYYY, HH:mm"
        );

        // Render trang chi tiết bài viết
        res.render("chiTietBaiViet.ejs", {
          articleDetals: article,
          userDetals: userResult.recordset[0],
          categoryDetals: categoryResult.recordset[0],
          formattedDate,
          comments: commentsResult.recordset,
          user: res.locals.username,
        });
      } else {
        res.render("notFound404.ejs");
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
    }
  }
);

// Route lấy thông tin bài báo theo ID
router.get('/getArticle/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        console.log('Đang lấy bài báo với ID:', articleId);
        
        // Truy vấn bài viết
        const articleQuery = `SELECT * FROM [dbo].[Article] WHERE id_article = @id`;
        const articleValues = [articleId];
        const articleParams = ["id"];
        
        const articleResult = await executeQuery(articleQuery, articleValues, articleParams, false);
        
        if (!articleResult.recordset || articleResult.recordset.length === 0) {
            console.log('Không tìm thấy bài báo với ID:', articleId);
            return res.json({ success: false, message: 'Không tìm thấy bài báo!' });
        }
        
        console.log('Tìm thấy bài báo:', articleResult.recordset[0].heading);
        res.json({ success: true, article: articleResult.recordset[0] });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin bài báo:', error);
        res.json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông tin bài báo!' });
    }
});

// Route cập nhật bài báo
router.post('/updateArticle', async (req, res) => {
    try {
        // In ra dữ liệu nhận được để debug
        console.log('Dữ liệu nhận được từ form:', req.body);
        
        const { id_article, heading, name_alias, id_category, hero_image, content } = req.body;
        
        // Kiểm tra dữ liệu đầu vào
        if (!id_article) {
            console.error('Thiếu ID bài báo');
            return res.json({ success: false, message: 'Thiếu ID bài báo!' });
        }
        
        // Kiểm tra bài báo tồn tại
        const checkQuery = `SELECT * FROM [dbo].[Article] WHERE id_article = @id`;
        const checkValues = [id_article];
        const checkParams = ["id"];
        
        const checkResult = await executeQuery(checkQuery, checkValues, checkParams, false);
        
        if (!checkResult.recordset || checkResult.recordset.length === 0) {
            console.error('Không tìm thấy bài báo với ID:', id_article);
            return res.json({ success: false, message: 'Không tìm thấy bài báo!' });
        }
        
        // Lấy thông tin hiện tại của bài báo
        const currentArticle = checkResult.recordset[0];
        
        // Sử dụng giá trị hiện tại nếu không có giá trị mới
        const updatedHeading = heading || currentArticle.heading;
        const updatedNameAlias = name_alias || currentArticle.name_alias;
        const updatedCategory = id_category || currentArticle.id_category;
        const updatedHeroImage = hero_image || currentArticle.hero_image;
        const updatedContent = content || currentArticle.content;
        
        console.log('Cập nhật bài báo với thông tin:', {
            id: id_article,
            heading: updatedHeading,
            name_alias: updatedNameAlias,
            category: updatedCategory
        });
        
        // Cập nhật thông tin bài báo
        const updateQuery = `
            UPDATE [dbo].[Article]
            SET heading = @heading,
                name_alias = @name_alias,
                id_category = @id_category,
                hero_image = @hero_image,
                content = @content
            WHERE id_article = @id_article
        `;
        
        const updateValues = [
            updatedHeading, 
            updatedNameAlias, 
            updatedCategory, 
            updatedHeroImage, 
            updatedContent, 
            id_article
        ];
        
        const updateParams = [
            "heading", 
            "name_alias", 
            "id_category", 
            "hero_image", 
            "content", 
            "id_article"
        ];
        
        await executeQuery(updateQuery, updateValues, updateParams, false);
        
        console.log('Cập nhật bài báo thành công với ID:', id_article);
        
        // Luôn trả về JSON response
        res.json({ success: true, message: 'Cập nhật bài báo thành công!' });
        
    } catch (error) {
        console.error('Lỗi khi cập nhật bài báo:', error);
        res.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật bài báo: ' + error.message });
    }
});

export { router }