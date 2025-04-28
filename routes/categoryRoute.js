import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
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
                        WHERE c.id_parent = @id;`;
        const values2 = [result.recordset[0].id_category];    
        const paramNames2 = ["id"];

        const result3 = await executeQuery(query2, values2, paramNames2, false);

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
 
        const startIndex = (page - 1)*limit;
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
        const query1 = `SELECT * FROM [dbo].[Article] WHERE id_category = @id`;
        const values1 = [result.recordset[0].id_category];    
        const paramNames1 = ["id"];

        const result1 = await executeQuery(query1, values1, paramNames1, false);
        // console.log(result1.recordset);
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

export { router };