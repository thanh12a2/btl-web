import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { articleController } from '../controllers/articleController.js';
import { authController } from '../controllers/authController.js';
import { executeQuery } from "../config/db.js";
import dayjs from 'dayjs';
import 'dayjs/locale/vi.js'; // Import tiếng Việt

dayjs.locale('vi'); // Đặt ngôn ngữ tiếng Việt

const router = express.Router();

router.get('/firstcategory/:id', async (req, res) => {
    const categoryId = req.params.id;

    const query = `SELECT * FROM [dbo].[Category] WHERE alias_name = @id`;
    const values = [categoryId];    
    const paramNames = ["id"];
    const isStoredProcedure = false;

    try {
        const result = await executeQuery(query, values, paramNames, isStoredProcedure);

        const query1 = `SELECT * FROM [dbo].[Category] WHERE id_parent = @id`;
        const values1 = [result.recordset[0].id_category];    
        const paramNames1 = ["id"];
    
        const result1 = await executeQuery(query1, values1, paramNames1, false);

        const query2 = `SELECT a.*, c.alias_name, c.category_name, c.id_parent
                        FROM Article a
                        JOIN Category c ON a.id_category = c.id_category
                        WHERE c.id_parent = @id AND a.status = N'Đã duyệt'
                        ORDER BY day_created DESC;`;
        const values2 = [result.recordset[0].id_category];    
        const paramNames2 = ["id"];

        const result3 = await executeQuery(query2, values2, paramNames2, false);

        // Format `day_created` trong kết quả của query2
        result3.recordset.forEach(article => {
            article.day_created = dayjs(article.day_created).format("dddd, D/M/YYYY, HH:mm");
        });

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
 
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        // Gom nhóm theo id_category
        const groupedByCategory = result3.recordset.reduce((acc, article) => {
            const { id_category } = article;
            if (!acc[id_category]) {
                acc[id_category] = [];
            }
            acc[id_category].push(article);
            return acc;
        }, {});

        // Tạo thông tin phân trang cho từng category
        const paginatedGroupedByCategory = Object.keys(groupedByCategory).reduce((acc, id_category) => {
            const categoryArticles = groupedByCategory[id_category];

            // Phân trang
            const categoryPaginated = categoryArticles.slice(startIndex, endIndex);

            // Tính toán trang trước / sau
            const categoryPageStatus = {};

            if (endIndex < categoryArticles.length) {
                categoryPageStatus.next = {
                    page: parseInt(page) + 1,
                    limit: parseInt(limit),
                };
            }

            if (startIndex > 0) {
                categoryPageStatus.previous = {
                    page: parseInt(page) - 1,
                    limit: parseInt(limit),
                };
            }

            categoryPageStatus.total = Math.ceil(categoryArticles.length / limit);

            acc[id_category] = {
                articles: categoryPaginated,
                pageStatus: categoryPageStatus,
            };

            return acc;
        }, {});

        const transformedData = Object.entries(paginatedGroupedByCategory).map(
            ([categoryId, value]) => ({
              categoryId,
              ...value
            })
        );

        res.render('trangDanhMuc.ejs', { categoryData: result.recordset, subCategoryData: result1.recordset, paginatedGroupedByCategory: transformedData });
    } catch (error) {
        res.render('notFound404.ejs');
    }
});

router.get('/secondcategory/:id', async (req, res) => {
    const categoryId = req.params.id;

    const query = `SELECT * FROM [dbo].[Category] WHERE alias_name = @id`;
    const values = [categoryId];    
    const paramNames = ["id"];
    const isStoredProcedure = false;
    try {
        const result = await executeQuery(query, values, paramNames, isStoredProcedure);

        let query1 

        if ( req.query.option == "oldest" ) {
            query1 = `SELECT *
                        FROM Article WHERE id_category = @id AND status = N'Đã duyệt'
                        ORDER BY day_created ASC;`;
        } else if ( req.query.option == "view") {
            query1 = `SELECT *
                        FROM [dbo].[Article]
                        WHERE id_category = @id AND status = N'Đã duyệt'
                        ORDER BY views DESC;`;
        } else if ( req.query.option == "like" ) {
            query1 = `  SELECT *
                        FROM [dbo].[Article]
                        WHERE id_category = @id
                        AND status = N'Đã duyệt'
                        ORDER BY like_count DESC;`;
        } else {
            query1 = `SELECT * FROM [dbo].[Article] WHERE id_category = @id AND status = N'Đã duyệt' ORDER BY day_created DESC;`;
        }

        const values1 = [result.recordset[0].id_category];    
        const paramNames1 = ["id"];

        const result1 = await executeQuery(query1, values1, paramNames1, false);
        
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
 
        const startIndex = (page - 1)*limit;
        const endIndex = page * limit;

        const pageStatus = {}

        if ( endIndex < result1.recordset.length ) {
            pageStatus.next = {
                page: parseInt(page) + 1,
                limit: parseInt(limit)
            }
        }

        if ( startIndex > 0 ) {
            pageStatus.previous = {
                page: parseInt(page) - 1,
                limit: parseInt(limit)
            }
        }

        pageStatus.total = Math.ceil(result1.recordset.length / limit);
        res.render('trangDanhMuc2.ejs', { pageStatus: pageStatus, articles: result1.recordset.slice(startIndex, endIndex), categoryData: result.recordset });
    } catch (error) {
        res.render('notFound404.ejs');
    }
});

router.post("/deleteCategory/:id", categoryController.deleteCategory);

router.post("/updateCategory", authController.authenticateToken, express.urlencoded({ extended: true }), express.json(), categoryController.updateCategory);


router.post("/addCategory", authController.authenticateToken, express.urlencoded({ extended: true }), express.json(), categoryController.addCategory);

router.get("/getAllCategories", authController.authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT id_category, category_name, id_parent 
            FROM [dbo].[Category]
            ORDER BY 
                CASE WHEN id_parent IS NULL THEN 0 ELSE 1 END, 
                id_category ASC
        `;
        const result = await executeQuery(query, [], [], false);

        // Tạo cấu trúc category cha - con
        const categories = result.recordset;
        const categoryMap = {};

        // Tạo một map để lưu các category
        categories.forEach(category => {
            category.children = []; // Thêm mảng `children` để chứa các category con
            categoryMap[category.id_category] = category; // Lưu category vào map
        });

        // Gắn các category con vào category cha
        const structuredCategories = [];
        categories.forEach(category => {
            if (category.id_parent) {
                // Nếu có `id_parent`, thêm vào mảng `children` của category cha
                categoryMap[category.id_parent]?.children.push(category);
            } else {
                // Nếu không có `id_parent`, đây là category cha
                structuredCategories.push(category);
            }
        });

        res.json(structuredCategories);
    } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        res.status(500).json({ error: "Không thể lấy danh sách danh mục" });
    }
});

export { router };