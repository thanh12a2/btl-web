import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: "drh4upxz5",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

/**
 * Uploads an image to Cloudinary.
 * @param {string} filePath - Path to the image file (local).
 * @param {string} folder - Folder name on Cloudinary (optional).
 * @returns {Promise<object>} Upload result.
 */

export async function uploadImageToCloudinary(filePath, folder = "heroImages") {
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder });
    fs.unlinkSync(filePath); // Xoá file sau khi upload

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      message: "Failed to upload image",
    };
  }
}
