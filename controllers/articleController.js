import { v2 as cloudinary } from "cloudinary";
import { executeQuery } from "../config/db.js";
import bodyParser from "body-parser";
import dayjs from "dayjs";
import "dayjs/locale/vi.js";

dayjs.locale("vi");

cloudinary.config({
  cloud_name: "drh4upxz5",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

export const articleController = {
  getArticles: async (req, res) => {
    const query = `SELECT * FROM [dbo].[Article]`;
    const values = [];
    const paramNames = [];
    const isStoredProcedure = false;
    try {
      const result = await executeQuery(
        query,
        values,
        paramNames,
        isStoredProcedure
      );
      return result.recordset;
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
    }
  },

  transportArticle: async (req, res) => {
    const articleId = req.params.id;

    // Truy vấn bài viết
    const articleQuery = `SELECT * FROM [dbo].[Article] WHERE name_alias = @id AND status = N'Đã duyệt'`;
    const articleValues = [articleId];
    const articleParams = ["id"];

    // Truy vấn tăng lượt xem bài viết
    const updateViewsQuery = `UPDATE [dbo].[Article] SET views = views + 1 WHERE name_alias = @name_alias AND status = N'Đã duyệt'`;
    const updateViewsValues = [articleId];
    const updateViewsParams = ["name_alias"];

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
        // Lấy danh sách bình luận
        const commentsResult = await executeQuery(commentQuery, commentValues, commentParams, false);

        // Format `day_created` trong kết quả
        commentsResult.recordset.forEach(comment => {
          comment.day_created = dayjs(comment.day_created).format("dddd, D/M/YYYY, HH:mm");
        });

        // Lấy thông tin bài viết
        const articleResult = await executeQuery(articleQuery, articleValues, articleParams, false);
        const article = articleResult.recordset[0];

        // Lấy thông tin danh mục
        const categoryValues = [article.id_category];
        const categoryParams = ["id_category"];
        const categoryResult = await executeQuery(categoryQuery, categoryValues, categoryParams, false);

        // Lấy thông tin người dùng
        const userValues = [article.id_user];
        const userParams = ["id_user"];
        const userResult = await executeQuery(userQuery, userValues, userParams, false);

        // Định dạng ngày
        const formattedDate = dayjs(article.day_created).format("dddd, D/M/YYYY, HH:mm");

        // Tăng lượt xem bài viết
        await executeQuery(updateViewsQuery, updateViewsValues, updateViewsParams, false);

        // console.log(commentsResult.recordset);
        // Render trang chi tiết bài viết
        res.render("chiTietBaiViet.ejs", {
            articleDetals: article,
            userDetals: userResult.recordset[0],
            categoryDetals: categoryResult.recordset[0],
            formattedDate,
            comments: commentsResult.recordset,
            user: res.locals.username
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
    }
},

  searchArticles: async (req, res) => {
    const query = `SELECT * FROM [dbo].[Article]
                    WHERE heading COLLATE Latin1_General_CI_AI LIKE '%' + @id + '%' AND status = N'Đã duyệt';`;
    const values = [`%${req.body.navbarTrenSb}%`]; // Đưa dấu % vào giá trị
    const paramNames = ["id"];

    try {
      const result = await executeQuery(query, values, paramNames, false);
      // res.json({ success: true, data: result.recordset });
      res.render("trangTimKiemBaiViet.ejs", {
        data: result.recordset,
      });
    } catch (error) {
      console.error(error);
      res.render("notFound404.ejs");
    }
  },

  getArticles1: async (req, res) => {
    const query = `SELECT * FROM [dbo].[Article]`;
    const values = [];
    const paramNames = [];
    const isStoredProcedure = false;
    try {
      const result = await executeQuery(
        query,
        values,
        paramNames,
        isStoredProcedure
      );
      return result.recordset;
    } catch (error) {
      console.error(error);
      return { recordset: [] };
    }
  },

  getArticlesOldest: async (req, res, next) => {
    if ( req.query.option == "oldest" ) {

      // console.log("co query option")
      const subQuery = `SELECT Category.id_category FROM Category WHERE Category.alias_name = @id`;
      const subValues = [req.params.id];
      const subParamName = ["id"];
  
      try {
        const subResult = await executeQuery(
          subQuery,
          subValues,
          subParamName,
          false
        );
        
        const query = `SELECT *
                  FROM Article WHERE id_category = @id AND status = N'Đã duyệt'
                  ORDER BY day_created DESC;`;
        const values = [subResult.recordset[0].id_category];
        const paramNames = ["id"];
        const result = await executeQuery(query, values, paramNames, false);
        // Lưu kết quả vào res.locals
        res.locals.oldestArticles = result.recordset;
        next(); // Chuyển sang middleware tiếp theo
        } catch (error) {
            console.error(error);
            next(error); // Chuyển lỗi sang middleware xử lý lỗi
        }
    } else {
        next(); // Nếu không có query option, chuyển sang middleware tiếp theo
    }
  },

  likeArticle: async (req, res) => {
    try {
      const query = `WITH UserCTE AS (
                        SELECT id_user
                        FROM [dbo].[User]
                        WHERE email = @email
                    ),
                    ArticleCTE AS (
                        SELECT id_article
                        FROM [dbo].[Article]
                        WHERE name_alias = @name_alias
                    )
                    INSERT INTO [dbo].[LikeArticle]
                    SELECT u.id_user, a.id_article
                    FROM UserCTE u, ArticleCTE a;`;
      const values = [res.locals.email, req.params.id];
      const paramName = ["email", "name_alias"];
      const result = await executeQuery(query, values, paramName, false);

      try {
        const query = `UPDATE [dbo].[Article]
        SET like_count = like_count + 1
        WHERE name_alias = @name_alias;`;
        const values = [req.params.id];
        const paramName = ["name_alias"];
        try {
          const result = await executeQuery(query, values, paramName, false);
        } catch (error) {
          res.json({ success: error });
        }
      } catch (error) {
        res.json({ success: error });
      }
      // console.log(res.locals.email);
      res.redirect("/article/transportArticle/" + req.params.id); 
    } catch (error) {
      res.redirect("/article/transportArticle/" + req.params.id); 
    }
  },

  sortArticlesByLikesCount: async (req, res) => {
    const query = `SELECT *
                    FROM [dbo].[Article]
                    WHERE id_category = (
                        SELECT id_category
                        FROM Category
                        WHERE alias_name = @id
                    ) AND status = N'Đã duyệt'
                    ORDER BY like_count DESC;`;
    const values = [req.params.id];
    const paramName = ["id"];

    try {
      const result = await executeQuery(query, values, paramName, false);
      res.json({ success: "Thanh cong !", data: result.recordset });
    } catch (error) {
      res.json({ success: error });
    }
  },

  sortArticlesByViewsCount: async (req, res) => {
    const query = `SELECT *
        FROM [dbo].[Article]
        WHERE id_category = (
            SELECT id_category
            FROM Category
            WHERE alias_name = @id
        ) AND status = N'Đã duyệt'
        ORDER BY views DESC;`;
    const values = [req.params.id];
    const paramName = ["id"];

    try {
      const result = await executeQuery(query, values, paramName, false);
      res.json({ success: "Thanh cong !", data: result.recordset });
    } catch (error) {
      res.json({ success: error });
    }
  },

  removeLikedArticle: async (req, res) => {
    try {
      const query = `WITH UserCTE AS (
                        SELECT id_user
                        FROM [dbo].[User]
                        WHERE email = @email
                    ),
                    ArticleCTE AS (
                        SELECT id_article
                        FROM [dbo].[Article]
                        WHERE name_alias = @name_alias
                    )
                    DELETE FROM [dbo].[LikeArticle]
                    WHERE id_user IN (SELECT id_user FROM UserCTE)
                      AND id_article IN (SELECT id_article FROM ArticleCTE);`;
      const values = [res.locals.email, req.params.id];
      const paramName = ["email", "name_alias"];
      const result = await executeQuery(query, values, paramName, false);

      try {
        const query = `UPDATE [dbo].[Article]
        SET like_count = like_count - 1
        WHERE name_alias = @name_alias;`;
        const values = [req.params.id];
        const paramName = ["name_alias"];
        try {
          await executeQuery(query, values, paramName, false);
        } catch (error) {
          res.json({ success: error });
        }
      } catch (error) {
        res.json({ success: error });
      }
      res.redirect('back');
    } catch (error) {
      res.json({ success: false, message: "Có lỗi xảy ra!" });
    }
  },

  getOutstandingArticle: async (req, res) => {
    const query = `
      SELECT TOP 9 * 
      FROM [dbo].[Article]
      WHERE is_featured = 1 AND status = N'Đã duyệt'
      ORDER BY day_created DESC
    `;
    const values = [];
    const paramNames = [];
    const isStoredProcedure = false;

    try {
      const result = await executeQuery(
        query,
        values,
        paramNames,
        isStoredProcedure
      );
      res.json({ success: true, data: result.recordset });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy bài viết nổi bật. Vui lòng thử lại!",
      });
    }
  },

  getTopArticles: async () => {
    const query = `
            WITH ArticleInteractions AS (
          SELECT 
              A.id_article,
              A.heading,
              A.hero_image,
              A.content,
              A.name_alias,
              A.views,
              A.like_count,
              ISNULL(CChild.id_parent, CChild.id_category) AS parent_category_id, -- Sửa chỗ này
              COUNT(C.id_comment) AS comment_count,
              (A.views * 1 + COUNT(C.id_comment) * 2 + A.like_count * 2) AS interaction_score
          FROM 
              [dbo].[Article] A
          LEFT JOIN 
              [dbo].[Comment] C ON A.id_article = C.id_article
          INNER JOIN 
              [dbo].[Category] CChild ON A.id_category = CChild.id_category
          WHERE 
              A.day_created >= DATEADD(YEAR, -2, GETDATE())
          GROUP BY 
              A.id_article, A.heading, A.hero_image, A.content, A.name_alias, 
              A.views, A.like_count, 
              CChild.id_category, CChild.id_parent
      ),
      RankedArticles AS (
          SELECT 
              *,
              ROW_NUMBER() OVER (PARTITION BY parent_category_id ORDER BY interaction_score DESC) AS rn
          FROM 
              ArticleInteractions
      )
      SELECT 
          id_article,
          heading,
          hero_image,
          content,
          name_alias,
          views,
          like_count,
          comment_count,
          interaction_score,
          parent_category_id
      FROM 
          RankedArticles
      WHERE 
          rn <= 9
      ORDER BY 
          parent_category_id, interaction_score DESC;

          `;

    try {
      const topArticles = await executeQuery(query, [], [], false);
      return topArticles;
    } catch (error) {
      return res.json({failed: "Co loi"});
    }
  },

  getLikedArticlesByUser: async () => {}
};
