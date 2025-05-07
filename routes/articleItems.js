import express from 'express';
import { getArticles } from "../controllers/All_ItemController.js";
import { getCategories } from '../controllers/All_ItemController.js';
import { getUsers } from '../controllers/All_ItemController.js';
import { 
    insertArticle, 
    updateArticle, 
    deleteArticle,
  } from '../controllers/CRUD_ArticleController.js';

import { insertCate, updateCate, deleteCate } from '../controllers/CRUD_CategoryController.js'
import { render } from 'ejs';


const router = express.Router();

router.get("/articles", getArticles);
router.get("/categories", getCategories)
router.get("/users", getUsers)

router.post('/articles', insertArticle);
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);


router.post('/categories', insertCate);
router.put('/categories/:id', updateCate);
router.delete('/categories/:id', deleteCate);


export { router }