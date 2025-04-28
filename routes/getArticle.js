import express from 'express';
import { articleController } from '../controllers/articleController.js';
import { authController } from "../controllers/authController.js";
import { commentController } from '../controllers/commentController.js';

const router = express.Router();

router.get("/getarticle", articleController.getArticles);

router.get("/transportArticle/:id", articleController.transportArticle);

router.post("/searchArticle", articleController.searchArticles);

router.get("/getArticlesOldest/:id", articleController.getArticlesOldest);

router.get("/likeArticle/:id", authController.authenticateToken, articleController.likeArticle);

router.delete("/removeArticle/:id", authController.authenticateToken, articleController.removeLikedArticle);

router.get("/sortArticlesByLikes/:id", articleController.sortArticlesByLikesCount);

router.get("/sortArticlesByViews/:id", articleController.sortArticlesByViewsCount);

router.post("/comment/:id", authController.authenticateToken, commentController.commentParent);

router.get("/getOutstandingArticle", articleController.getOutstandingArticle);

router.post("/likeComment", authController.authenticateToken, commentController.likeComment);

router.delete("/unlikeComment", authController.authenticateToken, commentController.unlikeComment);

router.get("/getCommentByArticle/:id", authController.authenticateToken, commentController.getCommentByArticle);

router.get("/sortCommentLatest/:id", authController.authenticateToken, commentController.sortCommentLatest);


export { router }