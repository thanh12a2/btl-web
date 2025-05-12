import express from 'express';
import { getArticles } from "../controllers/All_ItemController.js";
import { getCategories } from '../controllers/All_ItemController.js';
import { getUsers } from '../controllers/All_ItemController.js';
import { 
    insertArticle, 
    updateArticle, 
    deleteArticle,
    updateArticleStatus,
    updateArticleFeatured
  } from '../controllers/CRUD_ArticleController.js';

import { insertCate, updateCate, deleteCate } from '../controllers/CRUD_CategoryController.js'



const router = express.Router();

router.get("/articles", getArticles);
router.get("/categories", getCategories)
router.get("/users", getUsers)

router.post('/insertArticles', insertArticle);
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);


router.post('/categories', insertCate);
router.put('/categories/:id', updateCate);
router.delete('/categories/:id', deleteCate);

router.post('/article/updateStatus/:id', updateArticleStatus);
router.post('/article/updateFeatured/:id', updateArticleFeatured);



export { router }