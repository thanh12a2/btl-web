router.get("/backdetails", authController.authenticateToken, getArticles, getCategories, getUsers, async (req, res) => {
  const role = res.locals.role;

  if (role == "Admin") {
    const query3 = `SELECT * FROM [dbo].[Category]`;
    const query4 = `SELECT * FROM [dbo].[Comment]`;
    const query5 = `SELECT * FROM [dbo].[User] WHERE is_deleted = 0`;
    const query1 = `SELECT * FROM [dbo].[Article]`;
    const isStoredProcedure = false;
    let result2;
    let result3;
    let result4;
    let result5;

    try {
      result2 = await executeQuery(
        query1,
        [],
        [],
        isStoredProcedure
      );
    } catch (error) {
      console.error(error);
    }

    const query = `SELECT * FROM [dbo].[User] WHERE email = @email`
    const values = [res.locals.email];
    const paramNames = ["email"];

    const likeArticleQuery = `SELECT A.*
                              FROM LikeArticle LA
                              JOIN Article A ON LA.id_article = A.id_article
                              WHERE LA.id_user = @id;`
    try {
      const result = await executeQuery(query, values, paramNames, false);

      result3 = await executeQuery(
        query3,
        [],
        [],
        isStoredProcedure
      );

      result4 = await executeQuery(
        query4,
        [],
        [],
        isStoredProcedure
      );

      result5 = await executeQuery(
        query5,
        [],
        [],
        isStoredProcedure
      );

      const result1 = await executeQuery(likeArticleQuery, [result.recordset[0].id_user], ["id"], false);

      

      // Route handling code
      const articlePage = parseInt(req.query.articlePage) || 1;
      const categoryPage = parseInt(req.query.categoryPage) || 1;
      const userPage = parseInt(req.query.userPage) || 1;
      const commentPage = parseInt(req.query.commentPage) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const activeSection = req.query.section || "dashboard";
      const currentPage = parseInt(req.query.page) || 1;

      function paginate(data, page, limit) {
        if (!data || !Array.isArray(data)) {
          return {
            data: [],
            totalPages: 0,
            totalItems: 0,
            currentPage: page
          };
        }
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          data: data.slice(start, end),
          totalPages: Math.ceil(data.length / limit),
          totalItems: data.length,
          currentPage: page
        };
      }

      const articlesData = paginate(result2.recordset || [], articlePage, limit);
      const categoriesData = paginate(result3.recordset || [], categoryPage, limit);
      const usersData = paginate(result5.recordset || [], userPage, limit);
      const commentsData = paginate(result4.recordset || [], commentPage, limit);

      res.render("admin.ejs", { 
        user: result.recordset, 
        likeArticles: result1.recordset, 
        articles: articlesData.data, 
        categories: categoriesData.data, 
        comments: commentsData.data, 
        users: usersData.data,
        limit: limit,
        activeSection: activeSection,
        currentPage: currentPage,
        pagination: {
          articles: {
            totalPages: articlesData.totalPages,
            totalItems: articlesData.totalItems,
            currentPage: articlePage
          },
          categories: {
            totalPages: categoriesData.totalPages,
            totalItems: categoriesData.totalItems,
            currentPage: categoryPage
          },
          users: {
            totalPages: usersData.totalPages,
            totalItems: usersData.totalItems,
            currentPage: userPage
          },
          comments: {
            totalPages: commentsData.totalPages,
            totalItems: commentsData.totalItems,
            currentPage: commentPage
          }
        }
      });
    } catch(error) {
      res.render("notFound404.ejs");
    }
  } else if (role == "NhaBao") {
    res.render("nhaBao.ejs");
  } else if (role == "DocGia") {
    res.render("docGia.ejs");
  }
});