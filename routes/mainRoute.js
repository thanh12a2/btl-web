import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { articleController } from '../controllers/articleController.js';
import WeatherService from '../controllers/weatherDayController.js';

const router = express.Router();

// Route lấy trang chủ
router.get('/', async (req, res) => {
    try {
        const categories = await categoryController.getCategoriesTitle();
        const articles = await articleController.getArticles();

        res.render('index.ejs', { 
            isLoggedIn: req.isLoggedIn, 
            username: req.username,
            role: req.role,
            categoryTree: categories, 
            articles: articles,
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

// router.get('/:id', async (req, res) => {
//     res.render('notFound404.ejs')
// })

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