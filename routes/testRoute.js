

import { getUsers } from '../controllers/All_ItemController.js';
import 'dayjs/locale/vi.js'; // Import tiếng Việt
import express from "express";
import { categoryController } from "../controllers/categoryController.js";
import { articleController } from "../controllers/articleController.js";
import { statsController } from "../controllers/statsController.js";
import WeatherService from "../controllers/weatherDayController.js";
import { executeQuery } from "../config/db.js";

const router = express.Router();

router.get("/getAllCategory", categoryController.getCategoriesTitle1)

router.get("/getArticles", articleController.getArticles1)

router.get("/getUsers", getUsers)

router.get("/home", async (req, res) => {
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
    
        res.json({
          isLoggedIn: req.isLoggedIn,
          username: req.username,
          role: req.role,
          categoryTree: categories,
          articles: articles,
          topArticles: topArticles.recordset,
          TopArticlesEachCate: grouped
        });
    
        // res.render('index.ejs', {
        //     isLoggedIn: req.isLoggedIn,
        //     username: req.username,
        //     role: req.role,
        //     categoryTree: categories,
        //     articles: articles,
        //     topArticles: topArticles.recordset,
        //     // TopArticlesEachCate: TopArticlesEachCate.recordset
        // });
      } catch (error) {
        console.error("Error loading categories:", error);
        res.render("index.ejs", {
          isLoggedIn: req.isLoggedIn,
          username: req.username,
          role: req.role,
          categoryTree: [],
        });
      }
})



export { router };