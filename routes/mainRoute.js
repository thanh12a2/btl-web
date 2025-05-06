import express from "express";
import { categoryController } from "../controllers/categoryController.js";
import { articleController } from "../controllers/articleController.js";
import { statsController } from "../controllers/statsController.js";
import WeatherService from "../controllers/weatherDayController.js";
import { executeQuery } from "../config/db.js";
import { authController } from "../controllers/authController.js";

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

router.get("/backdetails", authController.authenticateToken, async (req, res) => {
  
  const role = res.locals.role;
  if (role == "Admin") {

    const query1 = `SELECT * FROM [dbo].[Article]`;
    const isStoredProcedure = false;
    let result2;

    try {
      result2 = await executeQuery(
        query1,
        [],
        [],
        isStoredProcedure
      );
    } catch (error) {
      console.error(error);
      // return { recordset: [] };
    }

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
      res.render("admin.ejs", { user: result.recordset, likeArticles: result1.recordset, articles: result2.recordset } );
    } catch(error) {
      res.render("notFound404.ejs");
    }
  } else if (role == "NhaBao") {
    res.render("nhaBao.ejs");
  } else if (role == "DocGia") {
    res.render("docGia.ejs");
  }
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
