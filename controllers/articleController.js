import { v2 as cloudinary } from 'cloudinary';
import { executeQuery } from "../config/db.js";
import dayjs from 'dayjs';
import 'dayjs/locale/vi.js'; // Import tiếng Việt

dayjs.locale('vi'); // Đặt ngôn ngữ tiếng Việt

// Configuration
cloudinary.config({ 
    cloud_name: 'drh4upxz5', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
    
// (async function() {
//     const result = await cloudinary.uploader.upload("../public/assets/test2.jpeg")
//     console.log(result);
// })();




export const articleController = {
    getArticles: async (req, res) => {
        const query = `SELECT * FROM [dbo].[Article]`;
        const values = [];
        const paramNames = [];
        const isStoredProcedure = false;
        try {
            const result = await executeQuery( query, values, paramNames, isStoredProcedure );
            return result.recordset;
        } catch(error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }
    },

    transportArticle: async (req, res) => {
        const articleId = req.params.id;
        const query = `SELECT * FROM [dbo].[Article] WHERE name_alias = @id`;
        const values = [articleId];
        const paramNames = ["id"];
        const isStoredProcedure = false;
        let result;
        try {
            result = await executeQuery( query, values, paramNames, isStoredProcedure );
        } catch(error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }

        const query2 = `SELECT 
                            pr.category_name AS parent_category, 
                            ch.category_name AS child_category
                        FROM 
                            [dbo].[Category] ch
                        LEFT JOIN 
                            [dbo].[Category] pr ON ch.id_parent = pr.id_category
                        WHERE 
                            ch.id_category = @id_category;`
        const values2 = [result.recordset[0].id_category];
        const paramNames2 = ["id_category"];
        const isStoredProcedure2 = false;
        let result2;
        try {
            result2 = await executeQuery( query2, values2, paramNames2, isStoredProcedure2 );
        } catch(error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }


        const query1 = `SELECT username FROM [dbo].[User] WHERE id_user = @id_user`;
        const values1 = [result.recordset[0].id_user];
        const paramNames1 = ["id_user"];
        const isStoredProcedure1 = false;
        try {
            const result1 = await executeQuery( query1, values1, paramNames1, isStoredProcedure1 );
            const rawDate = result.recordset[0].day_created;
            const formatted = dayjs(rawDate).format('dddd, D/M/YYYY, HH:mm');
            res.render("chiTietBaiViet.ejs", { 
                articleDetals: result.recordset[0],
                userDetals: result1.recordset[0],
                categoryDetals: result2.recordset[0],
                formattedDate: formatted})
        } catch(error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
        }


    }
};
