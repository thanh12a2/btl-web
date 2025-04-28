import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { uploadImageToCloudinary } from '../controllers/uploadPicturesController.js';

dotenv.config();

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;
  const result = await uploadImageToCloudinary(filePath, 'heroImages');

  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

export { router }


