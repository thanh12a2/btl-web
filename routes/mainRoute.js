import express from 'express';
import { categoryController } from "../controllers/categoryController.js";
import { articleController } from "../controllers/articleController.js";
import { statsController } from "../controllers/statsController.js";
import WeatherService from "../controllers/weatherDayController.js";
import { executeQuery } from "../config/db.js";
import { authController } from "../controllers/authController.js";
import { getArticles } from "../controllers/All_ItemController.js";
import { getCategories } from '../controllers/All_ItemController.js';
import { getUsers } from '../controllers/All_ItemController.js';
import { 
  insertArticle, 
  updateArticle, 
  deleteArticle,
} from '../controllers/CRUD_ArticleController.js';
import multer from 'multer';
import { processFileContent } from '../controllers/fileController.js';


const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Lưu file tạm thời trong thư mục `uploads`

// Route lấy trang chủ
router.get("/", async (req, res) => {
  try {
    const categories = await categoryController.getCategoriesTitle();
    const articles = await articleController.getArticles();
    const TopArticlesEachCate = await articleController.getTopArticles();

    const query = `
                SELECT TOP 9
                    A.id_article,
                    A.heading,
                    A.hero_image,
                    A.content,
                    A.name_alias,
                    A.views,
                    A.like_count,
                    COUNT(C.id_comment) AS comment_count,
                    (A.views * 1 + COUNT(C.id_comment) * 2 + A.like_count * 2) AS interaction_score
                FROM
                    [dbo].[Article] A
                LEFT JOIN [dbo].[Comment] C ON A.id_article = C.id_article
                WHERE
                    A.day_created >= DATEADD(YEAR, -2, GETDATE()) AND A.status = N'Đã duyệt'
                GROUP BY
                    A.id_article, A.heading, A.views, A.like_count, A.hero_image, A.content, A.name_alias
                ORDER BY
                    interaction_score DESC;
              `;
    const topArticles = await executeQuery(query, [], [], false);

    // Gộp thành các nhóm mảng
    const grouped = [];
    const groupMap = {};

    TopArticlesEachCate.recordset.forEach((article) => {
      const categoryId = article.parent_category_id;

      if (!groupMap[categoryId]) {
        groupMap[categoryId] = [];
        grouped.push(groupMap[categoryId]);
      }

      groupMap[categoryId].push(article);
    });

    res.render('index.ejs', {
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      role: req.role,
      categoryTree: categories,
      articles: articles,
      topArticles: topArticles.recordset,
      TopArticlesEachCate: grouped,
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    res.render("index.ejs", {
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      role: req.role,
      categoryTree: [],
    });
  }
});

router.get("/api/weather", async (req, res) => {
  try {
    const weatherData = await WeatherService.getWeatherData();
    if (weatherData) {
      res.json(weatherData);
    } else {
      res.status(404).json({ error: "Weather data not available" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

router.get("/backdetails", authController.authenticateToken, getArticles, getCategories, getUsers, async (req, res) => {
  const role = res.locals.role;

  if (role == "Admin") {
    const query3 = `SELECT * FROM [dbo].[Category]`;
    const query4 = `SELECT * FROM [dbo].[Comment]`;
    const query5 = `SELECT * FROM [dbo].[User] WHERE is_deleted = 0`;
    const query1 = `SELECT * FROM [dbo].[Article]`;
    const queryCate = `
            SELECT id_category, category_name, id_parent 
            FROM [dbo].[Category]
            ORDER BY 
                CASE WHEN id_parent IS NULL THEN 0 ELSE 1 END, 
                id_category ASC`;
    const isStoredProcedure = false;
    let result2;
    let result3;
    let result4;
    let result5;

    try {
      result2 = await executeQuery(query1, [], [], isStoredProcedure);
    } catch (error) {
      console.error(error);
    }

    const query = `SELECT * FROM [dbo].[User] WHERE email = @email`;
    const values = [res.locals.email];
    const paramNames = ["email"];

    const likeArticleQuery = `SELECT A.*
                              FROM LikeArticle LA
                              JOIN Article A ON LA.id_article = A.id_article
                              WHERE LA.id_user = @id;`;

    const UserCommentQuery = `
            SELECT 
                id_comment,
                a.heading as ten_bai_viet,
                c.comment_content as noi_dung_binh_luan,
                FORMAT(c.day_created, 'dd/MM/yyyy HH:mm') as ngay_binh_luan
            FROM Comment c
            LEFT JOIN Article a ON c.id_article = a.id_article
            WHERE c.id_user = @id
            ORDER BY c.day_created DESC
        `;

    try {
      const result = await executeQuery(query, values, paramNames, false);

      result3 = await executeQuery(query3, [], [], isStoredProcedure);
      result4 = await executeQuery(query4, [], [], isStoredProcedure);
      result5 = await executeQuery(query5, [], [], isStoredProcedure);

      const result1 = await executeQuery(likeArticleQuery, [result.recordset[0].id_user], ["id"], false);
      const result6 = await executeQuery(UserCommentQuery, [result.recordset[0].id_user], ["id"], false);

      // Lấy từ khóa tìm kiếm từ query string
      const searchQuery = req.query.searchInp || "";
      const searchQueryCategory = req.query.searchInpCate || "";
      
      if (searchQuery) {
        const searchQuerySQL = `
          SELECT id_user, username, email, password, role
          FROM [dbo].[User]
          WHERE 
              (id_user LIKE @searchQuery OR
              username LIKE @searchQuery OR
              email LIKE @searchQuery OR
              password LIKE @searchQuery OR
              role LIKE @searchQuery)
              AND is_deleted = 'False'
        `;
        const searchValues = [`%${searchQuery}%`];
        const searchParamNames = ["searchQuery"];
        const searchResult = await executeQuery(searchQuerySQL, searchValues, searchParamNames, false);

        // Ghi đè kết quả tìm kiếm vào `result5`
        result5 = { recordset: searchResult.recordset };
      }

      if (searchQueryCategory) {
        const searchQuery = `
          SELECT *
          FROM [dbo].[Category]
          WHERE 
            (id_category LIKE @searchQuery OR
            category_name LIKE @searchQuery OR
            alias_name LIKE @searchQuery OR
            id_parent LIKE @searchQuery)
          `;
        const searchValues = [`%${searchQueryCategory}%`];
        const searchParamNames = ["searchQuery"];
        const searchResultCate = await executeQuery(searchQuery, searchValues, searchParamNames, false);

        result3 = { recordset: searchResultCate.recordset };
      }

      // Route handling code
      const articlePage = parseInt(req.query.articlePage) || 1;
      const categoryPage = parseInt(req.query.categoryPage) || 1;
      const userPage = parseInt(req.query.userPage) || 1;
      
      const commentPage = parseInt(req.query.commentPage) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const activeSection = req.query.section || "dashboard";
      const currentPage = parseInt(req.query.page) || 1;

      function paginate(data, page, limit) {
        if (!data || !Array.isArray(data)) {
          return {
            data: [],
            totalPages: 0,
            totalItems: 0,
            currentPage: page,
          };
        }
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          data: data.slice(start, end),
          totalPages: Math.ceil(data.length / limit),
          totalItems: data.length,
          currentPage: page,
        };
      }

      const articlesData = paginate(result2.recordset || [], articlePage, limit);
      const categoriesData = paginate(result3.recordset || [], categoryPage, limit);
      const usersData = paginate(result5.recordset || [], userPage, limit);
      const commentsData = paginate(result4.recordset || [], commentPage, limit);
      const resultCate = await executeQuery(queryCate, [], [], false);

      // Tạo cấu trúc category cha - con
      const categories = resultCate.recordset;
      const categoryMap = {};

      // Tạo một map để lưu các category
      categories.forEach((category) => {
        category.children = []; // Thêm mảng `children` để chứa các category con
        categoryMap[category.id_category] = category; // Lưu category vào map
      });

      // Gắn các category con vào category cha
      const structuredCategories = [];
      categories.forEach((category) => {
        if (category.id_parent) {
          // Nếu có `id_parent`, thêm vào mảng `children` của category cha
          categoryMap[category.id_parent]?.children.push(category);
        } else {
          // Nếu không có `id_parent`, đây là category cha
          structuredCategories.push(category);
        }
      });
      
      res.render("admin.ejs", {
        user: result.recordset, 
        likeArticles: result1.recordset, 
        articles: articlesData.data, 
        categories: categoriesData.data, 
        comments: commentsData.data, 
        users: usersData.data,
        limit: limit,
        activeSection: activeSection,
        currentPage: currentPage,
        structuredCategories: structuredCategories,
        userComments: result6.recordset,
        pagination: {
          articles: {
            totalPages: articlesData.totalPages,
            totalItems: articlesData.totalItems,
            currentPage: articlePage
          },
          categories: {
            totalPages: categoriesData.totalPages,
            totalItems: categoriesData.totalItems,
            currentPage: categoryPage
          },
          users: {
            totalPages: usersData.totalPages,
            totalItems: usersData.totalItems,
            currentPage: userPage
          },
          comments: {
            totalPages: commentsData.totalPages,
            totalItems: commentsData.totalItems,
            currentPage: commentPage
          }
        }
      });
    } catch (error) {
      res.render("notFound404.ejs");
    }
  } else if (role == "NhaBao") {
    const query = `SELECT * FROM [dbo].[User] WHERE email = @email`;
    const values = [res.locals.email];
    const paramNames = ["email"];
    let resultUserNhaBao;

    try {
      resultUserNhaBao = await executeQuery(query, values, paramNames, false);
    } catch (error) {
      console.error(error);
    }

    res.render("nhaBao.ejs", {
      user: resultUserNhaBao.recordset
    });
  } else if (role == "DocGia") {
    res.render("docGia.ejs");
  }
});

// 1. Add this route to your routes file to connect to your existing controller
router.post("/add-article", authController.authenticateToken, (req, res) => {
  // Call your existing insertArticle controller
  insertArticle(req, res);
});

router.get("/test12", articleController.searchArticles);

router.get("/home", async (req, res) => {
  try {
    const categories = await categoryController.getCategoriesTitle();
    const articles = await articleController.getArticles();
    const TopArticlesEachCate = await articleController.getTopArticles();

    const query = `
                SELECT TOP 9
                    A.id_article,
                    A.heading,
                    A.hero_image,
                    A.content,
                    A.name_alias,
                    A.views,
                    A.like_count,
                    COUNT(C.id_comment) AS comment_count,
                    (A.views * 1 + COUNT(C.id_comment) * 2 + A.like_count * 2) AS interaction_score
                FROM
                    [dbo].[Article] A
                LEFT JOIN [dbo].[Comment] C ON A.id_article = C.id_article
                WHERE
                    A.day_created >= DATEADD(YEAR, -2, GETDATE())
                GROUP BY
                    A.id_article, A.heading, A.views, A.like_count, A.hero_image, A.content, A.name_alias
                ORDER BY
                    interaction_score DESC;
              `;
    const topArticles = await executeQuery(query, [], [], false);

    // Gộp thành các nhóm mảng
    const grouped = [];
    const groupMap = {};

    TopArticlesEachCate.recordset.forEach((article) => {
      const categoryId = article.parent_category_id;

      if (!groupMap[categoryId]) {
        groupMap[categoryId] = [];
        grouped.push(groupMap[categoryId]);
      }

      groupMap[categoryId].push(article);
    });

    res.render('index.ejs', {
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      role: req.role,
      categoryTree: categories,
      articles: articles,
      topArticles: topArticles.recordset,
      TopArticlesEachCate: grouped,
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    res.render("index.ejs", {
      isLoggedIn: req.isLoggedIn,
      username: req.username,
      role: req.role,
      categoryTree: [],
    });
  }
});

router.post('/processFile', upload.single('file'), async (req, res) => {
    try {

       console.log('Thông tin file:', req.file); // Kiểm tra thông tin file
        console.log('Đường dẫn file:', req.file?.path); // Kiểm tra đường dẫn file
        console.log('Loại file:', req.file?.mimetype); // Kiểm tra loại file


        const filePath = req.file.path;
        const fileType = req.file.mimetype;

        // Xử lý file và chuyển đổi nội dung thành text
        const text = await processFileContent(filePath, fileType);

        res.json({ success: true, text });
    } catch (error) {
        console.error('Lỗi khi xử lý file:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xử lý file!' });
    }
});

export { router };
