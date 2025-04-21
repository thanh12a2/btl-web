import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { articleController } from '../controllers/articleController.js';
import { getUsers } from '../controllers/All_ItemController.js';
import 'dayjs/locale/vi.js'; // Import tiếng Việt
import { statsController } from '../controllers/statsController.js';

const router = express.Router();

router.get("/top5articles", statsController.topArticles);

router.get("/topjournalist", statsController.mostApprovedJournalist);

export { router };