import express from 'express';
import { articleController } from '../controllers/articleController.js';
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.get("/getarticle", articleController.getArticles);

router.get("/transportArticle/:id", articleController.transportArticle);

router.get("/searchArticle", articleController.searchArticles);

router.get("/getArticlesOldest/:id", articleController.getArticlesOldest);

router.get("/likeArticle/:id", authController.authenticateToken, articleController.likeArticle);

router.delete("/removeArticle/:id", authController.authenticateToken, articleController.removeLikedArticle);

router.get("/sortArticlesByLikes/:id", articleController.sortArticlesByLikesCount);

router.get("/sortArticlesByViews/:id", articleController.sortArticlesByViewsCount);

export { router }