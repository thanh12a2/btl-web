import { executeQuery } from "../config/db.js";

export const paginationController = {
    pagination: async (req, res) => {
       const query = `SELECT * FROM [dbo].[Article] WHERE id_category = 'C016'`;
       try {
        const result = await executeQuery(query, [], [], false);

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
 
        const startIndex = (page - 1)*limit;
        const endIndex = page * limit;

        const pageStatus = {}

        if ( endIndex < result.recordset.length ) {
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

        res.json({ success: true, data: result.recordset.slice(startIndex, endIndex), data: pageStatus });
       } catch (error) {
        
       }
    },
};
  