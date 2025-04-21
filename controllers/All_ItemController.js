import sql from "mssql";
import config from "../config/db.js";

const getArticles = async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            SELECT 
                a.id_article, u.username, a.heading, 
                pc.category_name AS parent_category_name, 
                c.category_name, a.hero_image, 
                a.content, a.name_alias, a.views, a.like_count, 
                a.is_featured, a.day_created 
            FROM [dbo].[Article] AS a
            INNER JOIN [dbo].[Category] AS c ON a.id_category = c.id_category
            LEFT JOIN [dbo].[Category] AS pc ON c.id_parent = pc.id_category 
            INNER JOIN [dbo].[User] AS u ON a.id_user = u.id_user;
        `);
        res.json(result.recordset)
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};
const getCategories = async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            Select c.id_category, c.category_name, c.id_parent, c.alias_name, ca.category_name AS parent_category_name from [dbo].[Category] AS c left join [dbo].[Category] AS ca on c.id_parent = ca.id_category
        `);
        res.json(result.recordset)
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};
const getUsers= async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query(`
            Select * from [dbo].[User]
        `);
        res.json(result.recordset)
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
};
export { getArticles };
export { getCategories };
export { getUsers };


