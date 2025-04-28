import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { articleController } from '../controllers/articleController.js';
import { statsController } from '../controllers/statsController.js';
import WeatherService from '../controllers/weatherDayController.js';
import { executeQuery } from '../config/db.js';

const router = express.Router();

// Route lấy trang chủ
router.get('/', async (req, res) => {
    try {
        const categories = await categoryController.getCategoriesTitle();
        const articles = await articleController.getArticles();
        
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

        // res.json({
        //     isLoggedIn: req.isLoggedIn, 
        //     username: req.username,
        //     role: req.role,
        //     categoryTree: categories, 
        //     articles: articles,
        //     topArticles: topArticles.recordset
        // })

        res.render('index.ejs', { 
            isLoggedIn: req.isLoggedIn, 
            username: req.username,
            role: req.role,
            categoryTree: categories, 
            articles: articles,
            topArticles: topArticles.recordset
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        res.render('index.ejs', { 
            isLoggedIn: req.isLoggedIn, 
            username: req.username,
            role: req.role,
            categoryTree: []
        });
    }
});

router.get('/api/weather', async (req, res) => {
    try {
        const weatherData = await WeatherService.getWeatherData();
        if (weatherData) {
            // res.render('admin.ejs')
            res.json(weatherData);
        } else {
            res.status(404).json({ error: 'Weather data not available' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// router.get('/404', async (req, res) => {
//     res.render('admin.ejs')
// })

router.get('/backdetails', async (req, res) => {
    const role = res.locals.role;
    if ( role == "Admin") {
        res.render('admin.ejs')
    }
    else if ( role == "NhaBao") {
        res.render('admin.ejs')
    }
    else if ( role == "DocGia") {
        res.render('admin.ejs')
    }
})


router.get('/test12', articleController.searchArticles)

export { router };