import express from 'express';
import { paginationController } from '../controllers/paginationController.js';
import { executeQuery } from "../config/db.js";

const router = express.Router();

router.get('', paginationController.pagination);

export { router }