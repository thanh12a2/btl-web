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
import dayjs from 'dayjs';
import 'dayjs/locale/vi.js'; // Import tiếng Việt
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('vi');


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
      result2.recordset.forEach(article => {        
        const formattedDate = dayjs(article.day_created).format('dddd, D/M/YYYY, HH:mm');
        article.day_created = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      });
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

      result4.recordset.forEach(article => {        
        const formattedDate = dayjs(article.day_created).format('dddd, D/M/YYYY, HH:mm');
        article.day_created = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      });

      const result1 = await executeQuery(likeArticleQuery, [result.recordset[0].id_user], ["id"], false);
      const result6 = await executeQuery(UserCommentQuery, [result.recordset[0].id_user], ["id"], false);

      const allArticles = result2.recordset || [];

      // Tổng lượt xem
      const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);

      // Tổng lượt thích
      const totalLikes = allArticles.reduce((sum, a) => sum + (a.like_count || 0), 0);

      // Số bài viết nổi bật
      const featuredArticles = allArticles.filter(a => a.is_featured).length;

      // Tính số bài theo danh mục
      const articleCountByCategory = {};
      result2.recordset.forEach(a => {
        const categoryId = a.id_category;
        if (!articleCountByCategory[categoryId]) articleCountByCategory[categoryId] = 0;
        articleCountByCategory[categoryId]++;
      });

      // Ghép tên danh mục
      const categoryArticleStats = result3.recordset.map(c => ({
        name: c.category_name,
        count: articleCountByCategory[c.id_category] || 0
      }));

      // Hàm xử lý khoảng thời gian (giữ nguyên như bạn đã cung cấp)
      const handleTimeRange = (range, result2) => {
        const articleCountByDate = {};
        const today = new Date();
        let dateFormat, startDate;

        // Xác định khoảng thời gian và định dạng ngày dựa trên range
        switch (range) {
          case '7':  // 7 ngày
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            dateFormat = 'day';
            break;
          case '30': // 30 ngày
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            dateFormat = 'day';
            break;
          case '90':  // 3 tháng
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 3);
            dateFormat = 'month';
            break;
          case '180':  // 6 tháng
            startDate = new Date(today);
            startDate.setMonth(startDate.getMonth() - 6);
            dateFormat = 'month';
            break;
          case '365': // 1 năm
            startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 1);
            dateFormat = 'month';
            break;
          default:   // Mặc định 30 ngày
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            dateFormat = 'day';
            break;
        }

        // Lọc và đếm bài viết
        result2.recordset.forEach(article => {
          const articleDate = new Date(article.day_created);

          // Chỉ đếm bài viết trong khoảng thời gian đã chọn
          if (articleDate >= startDate && articleDate <= today) {
            let dateKey;

            if (dateFormat === 'day') {
              // Định dạng ngày/tháng/năm cho hiển thị theo ngày
              dateKey = `${articleDate.getDate().toString().padStart(2, '0')}/${(articleDate.getMonth() + 1).toString().padStart(2, '0')}/${articleDate.getFullYear()}`;
            } else {
              // Định dạng tháng/năm cho hiển thị theo tháng
              dateKey = `Tháng ${articleDate.getMonth() + 1}/${articleDate.getFullYear()}`;
            }

            articleCountByDate[dateKey] = (articleCountByDate[dateKey] || 0) + 1;
          }
        });

        // Tạo đầy đủ các ngày/tháng trong khoảng thời gian
        let current = new Date(startDate);
        while (current <= today) {
          let dateKey;

          if (dateFormat === 'day') {
            dateKey = `${current.getDate().toString().padStart(2, '0')}/${(current.getMonth() + 1).toString().padStart(2, '0')}/${current.getFullYear()}`;
            // Tăng lên 1 ngày
            current.setDate(current.getDate() + 1);
          } else {
            dateKey = `Tháng ${current.getMonth() + 1}/${current.getFullYear()}`;
            // Tăng lên 1 tháng
            current.setMonth(current.getMonth() + 1);
          }

          // Đảm bảo tất cả các ngày/tháng đều tồn tại trong kết quả, kể cả khi không có bài viết
          if (articleCountByDate[dateKey] === undefined) {
            articleCountByDate[dateKey] = 0;
          }
        }

        // Biến đổi thành mảng để vẽ biểu đồ và sắp xếp theo ngày/tháng
        const articleDateStats = Object.entries(articleCountByDate)
          .map(([date, count]) => ({ date, count }));

        // Sắp xếp theo ngày/tháng
        if (dateFormat === 'day') {
          articleDateStats.sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('/').map(Number);
            const [dayB, monthB, yearB] = b.date.split('/').map(Number);

            if (yearA !== yearB) return yearA - yearB;
            if (monthA !== monthB) return monthA - monthB;
            return dayA - dayB;
          });
        } else {
          articleDateStats.sort((a, b) => {
            const monthYearA = a.date.replace('Tháng ', '').split('/').map(Number);
            const monthYearB = b.date.replace('Tháng ', '').split('/').map(Number);

            if (monthYearA[1] !== monthYearB[1]) return monthYearA[1] - monthYearB[1];
            return monthYearA[0] - monthYearB[0];
          });
        }

        return articleDateStats;
      };
      // Chuẩn bị dữ liệu cho tất cả các khoảng thời gian
      const articleDateStats7 = handleTimeRange('7', result2);
      const articleDateStats30 = handleTimeRange('30', result2);
      const articleDateStats90 = handleTimeRange('90', result2);
      const articleDateStats180 = handleTimeRange('180', result2);
      const articleDateStats365 = handleTimeRange('365', result2);

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
      const getAllCate = result3.recordset;

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
        totalViews,
        totalLikes,
        featuredArticles,
        categoryArticleStats,
        getAllCate,
        articleDateStats7,
        articleDateStats30,
        articleDateStats90,
        articleDateStats180,
        articleDateStats365,
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
    const query = `SELECT * FROM [dbo].[User] WHERE email = @email`;
    const values = [res.locals.email];
    const paramNames = ["email"];
    let resultUserNguoiDung;
    let result20;
    let result21;

    const likeArticleQueryNguoiDung = `SELECT A.*
                              FROM LikeArticle LA
                              JOIN Article A ON LA.id_article = A.id_article
                              WHERE LA.id_user = @id;`;

    const UserCommentQueryNguoiDung = `
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
      resultUserNguoiDung = await executeQuery(query, values, paramNames, false);

      result20 = await executeQuery(likeArticleQueryNguoiDung, [resultUserNguoiDung.recordset[0].id_user], ["id"], false);
      result21 = await executeQuery(UserCommentQueryNguoiDung, [resultUserNguoiDung.recordset[0].id_user], ["id"], false);
    } catch (error) {
      console.error(error);
    }

    res.render("docGia.ejs", {
      user: resultUserNguoiDung.recordset,
      likeArticles: result20.recordset,
      userComments: result21.recordset,

    });
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
