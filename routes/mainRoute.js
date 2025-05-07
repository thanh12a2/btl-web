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
const router = express.Router();

// Route lấy trang chủ
router.get("/", async (req, res) => {
  try {
    const categories = await categoryController.getCategoriesTitle();
    const articles = await articleController.getArticles();
    const TopArticlesEachCate = await articleController.getTopArticles();

    // console.log(grouped);

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

    // res.json({
    //   isLoggedIn: req.isLoggedIn,
    //   username: req.username,
    //   role: req.role,
    //   categoryTree: categories,
    //   articles: articles,
    //   topArticles: topArticles.recordset,
    //   TopArticlesEachCate: grouped,
    // });

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
      // res.render('admin.ejs')
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

  const query = `SELECT * FROM [dbo].[User] WHERE email = @email`
  const values = [res.locals.email];
  const paramNames = ["email"];

  const likeArticleQuery = `SELECT A.*
                            FROM LikeArticle LA
                            JOIN Article A ON LA.id_article = A.id_article
                            WHERE LA.id_user = @id;`
  try {
    const result = await executeQuery(query, values, paramNames, false);
    // console.log(result.recordset[0].id_user);
    const result1 = await executeQuery(likeArticleQuery, [result.recordset[0].id_user], ["id"], false);
    // console.log(result1.recordset)


    // Route handling code
    const articlePage = parseInt(req.query.articlePage) || 1;
    const categoryPage = parseInt(req.query.categoryPage) || 1;
    const userPage = parseInt(req.query.userPage) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const table = req.query.table || "dashboard"; // Default to dashboard or whatever your first section is
    const activeSection = req.query.section || "dashboard"; // Track which section is active
    const currentPage = parseInt(req.query.page) || 1; // Current page for article management

    function paginate(data, page, limit) {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: data.slice(start, end),
        totalPages: Math.ceil(data.length / limit),
        totalItems: data.length,
        currentPage: page // Add the current page to the pagination object
      };
    }

    const articlesData = paginate(res.locals.articles || [], articlePage, limit);
    const categoriesData = paginate(res.locals.categories || [], categoryPage, limit);
    const usersData = paginate(res.locals.users || [], userPage, limit);

    res.render("admin.ejs", {
      user: result.recordset,
      likeArticles: result1.recordset,
      articles: articlesData.data,
      categories: categoriesData.data,
      users: usersData.data,
      limit: limit,
      activeSection: activeSection, // Pass the active section to the template
      currentPage: currentPage, // Pass the current page for article management
      pagination: {
        articlePage,
        categoryPage,
        userPage,
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
        currentPage: currentPage, // Add current page to pagination object
        totalPages: articlesData.totalPages // Total pages for article management
      }
    });
  } catch (error) {
    res.render("notFound404.ejs");
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

export { router };
