import { executeQuery } from "../config/db.js";


async function getLastRecordId() {
  const query = `SELECT TOP 1 id_comment
                   FROM [dbo].[Comment] 
                   ORDER BY id_comment DESC`;

  try {
    const resultIdComment = await executeQuery(query, [], [], false);

    if (resultIdComment && resultIdComment.recordset && resultIdComment.recordset.length > 0) {
      const lastId = resultIdComment.recordset[0].id_comment; // Sửa chỗ này
      const lastNumber = parseInt(lastId.substring(2));
      console.log("lastId: " + lastId)
      console.log("lastNumber: " + lastNumber);
      return `CM${String(lastNumber + 1).padStart(3, "0")}`;
    }
    return "C001"; // Trả về ID đầu tiên nếu chưa có bản ghi nào
  } catch (error) {
    console.error("Lỗi khi lấy ID cuối cùng:", error);
    throw error;
  }
}

export const commentController = {
  commentParent: async (req, res) => {
    const query = ` WITH UserCTE AS (
                        SELECT id_user
                        FROM [dbo].[User]
                        WHERE email = @email
                    ),
                    ArticleCTE AS (
                        SELECT id_article
                        FROM [dbo].[Article]
                        WHERE name_alias = @name_alias
                    )
                    INSERT INTO [dbo].[Comment]
                    SELECT
                        @id_comment,
                        u.id_user,
                        a.id_article,
                        NULL,
                        SYSDATETIMEOFFSET(),
                        @comment_content,
                        0
                    FROM UserCTE u
                    CROSS JOIN ArticleCTE a; `;
    const newId = await getLastRecordId();
    console.log(newId);
    const values = [
      res.locals.email,
      req.params.id,
      newId,
      req.body.commentInp,
    ];
    const paramNames = ["email", "name_alias", "id_comment", "comment_content"];
    try {
      await executeQuery(query, values, paramNames, false);
      res.redirect("back");
    } catch (error) {
      res.json({ status: "false" });
    }
  },

  likeComment: async (req, res) => {
    const queryCheck = `  SELECT COUNT(*) AS count
                          FROM [dbo].[LikeComment]
                          WHERE id_user = (
                              SELECT id_user
                              FROM [dbo].[User]
                              WHERE email = @email
                          )
                          AND id_comment = @id_comment; `;
    const valuesCheck = [res.locals.email, req.body["data-id"]];
    const paramNamesCheck = ["email", "id_comment"];
    const query = `WITH UserCTE AS (
                        SELECT id_user
                        FROM [dbo].[User]
                        WHERE email = @email
                    )
                    INSERT INTO [dbo].[LikeComment] 
                    SELECT u.id_user, @id_comment
                    FROM UserCTE u`;
    const values = [res.locals.email, req.body["data-id"]];
    const paramNames = ["email", "id_comment"];
    const query1 = `UPDATE [dbo].[Comment]
                    SET like_count = like_count + 1
                    WHERE id_comment = @id_comment;`;
    const values1 = [req.body["data-id"]];
    const paramNames1 = ["id_comment"];
    try {
      const result = await executeQuery(
        queryCheck,
        valuesCheck,
        paramNamesCheck,
        false
      );
      const isLiked = result.recordset[0].count > 0;

      if (isLiked) {
        // Nếu đã tồn tại, xóa bản ghi (bỏ like)
        const queryDelete = `
            DELETE FROM [dbo].[LikeComment]
            WHERE id_user = (
                SELECT id_user
                FROM [dbo].[User]
                WHERE email = @email
            )
            AND id_comment = @id_comment;
        `;
        const valuesDelete = [res.locals.email, req.body["data-id"]];
        const paramNamesDelete = ["email", "id_comment"];

        await executeQuery(queryDelete, valuesDelete, paramNamesDelete, false);

        // Giảm số lượng like
        const queryUpdateUnlike = `
            UPDATE [dbo].[Comment]
            SET like_count = like_count - 1
            WHERE id_comment = @id_comment;
        `;
        const valuesUpdateUnlike = [req.body["data-id"]];
        const paramNamesUpdateUnlike = ["id_comment"];

        await executeQuery(
          queryUpdateUnlike,
          valuesUpdateUnlike,
          paramNamesUpdateUnlike,
          false
        );
      } else {
        await executeQuery(query, values, paramNames, false);
        await executeQuery(query1, values1, paramNames1, false);
      }
      res.redirect("back");
    } catch (error) {
      res.json({ false: "Khong thanh cong" });
    }
  },

  unlikeComment: async (req, res) => {
    const query = `WITH UserCTE AS (
                    SELECT id_user
                    FROM [dbo].[User]
                    WHERE email = @email
                )
                DELETE FROM [dbo].[LikeComment]
                WHERE id_user IN (SELECT id_user FROM UserCTE)
                AND id_comment = @id_comment;`;
    const values = [res.locals.email, req.body["data-id"]];
    const paramNames = ["email", "id_comment"];

    const query1 = `UPDATE [dbo].[Comment]
        SET like_count = like_count - 1
        WHERE id_comment = @id_comment;`;
    const values1 = [req.body["data-id"]];
    const paramNames1 = ["id_comment"];
    try {
      await executeQuery(query, values, paramNames, false);
      await executeQuery(query1, values1, paramNames1, false);
      res.json({
        success: "Bo like comment thanh cong !",
        email: res.locals.email,
      });
    } catch (error) {
      res.json({ false: "Khong thanh cong" });
    }
  },

  removeComment: async (req, res) => {
    try {
      const query = `DELETE FROM [dbo].[Comment] 
                    WHERE id_comment = @id_comment 
                    AND id_user IN (
                      SELECT id_user 
                      FROM [dbo].[User] 
                      WHERE email = @email
                    );`;

      const values = [req.params.id, res.locals.email];
      const paramName = ["id_comment", "email"];
      await executeQuery(query, values, paramName, false);

      res.redirect("back");
    } catch (error) {
      res.json({ success: false, message: "Có lỗi xảy ra khi xóa bình luận!" });
    }
  },

  getCommentByArticle: async (req, res) => {
    const query = `SELECT * 
                    FROM [dbo].[Comment]
                    WHERE id_article = (
                    SELECT id_article 
                    FROM [dbo].[Article] 
                    WHERE name_alias = @name_alias
                    )
                    ORDER BY day_created ASC;`;
    const values = [req.params.id];
    const paramNames = ["name_alias"];
    try {
      const result = await executeQuery(query, values, paramNames, false);

      res.json({ success: "Thanh cong", data: result.recordset });
    } catch (error) {
      res.json({ failed: "Khong thanh cong !" });
    }
  },

  sortCommentLatest: async (req, res) => {
    const query = `SELECT * 
                    FROM [dbo].[Comment]
                    WHERE id_article = (
                    SELECT id_article 
                    FROM [dbo].[Article] 
                    WHERE name_alias = @name_alias
                    )
                    ORDER BY day_created DESC;`;
    const values = [req.params.id];
    const paramNames = ["name_alias"];
    try {
      const result = await executeQuery(query, values, paramNames, false);
      res.json({ success: "Thanh cong", data: result.recordset });
    } catch (error) {
      res.json({ failed: "Khong thanh cong !" });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const commentId = req.params.id || req.body["data-id"];

      // Kiểm tra xem comment có tồn tại không
      const checkCommentQuery = `
        SELECT * FROM [dbo].[Comment]
        WHERE id_comment = @id_comment
      `;
      const commentResult = await executeQuery(
        checkCommentQuery,
        [commentId],
        ["id_comment"],
        false
      );

      if (
        !commentResult ||
        !commentResult.recordset ||
        commentResult.recordset.length === 0
      ) {
        return res.status(404).json({ error: "Không tìm thấy bình luận" });
      }

      // Xóa tất cả comment con (nếu có)
      const deleteChildrenQuery = `
        DELETE FROM [dbo].[Comment]
        WHERE id_parent = @id_comment
      `;
      await executeQuery(
        deleteChildrenQuery,
        [commentId],
        ["id_comment"],
        false
      );

      // Xóa tất cả like của comment
      const deleteLikesQuery = `
        DELETE FROM [dbo].[LikeComment]
        WHERE id_comment = @id_comment
      `;
      await executeQuery(deleteLikesQuery, [commentId], ["id_comment"], false);

      // Xóa comment chính
      const deleteCommentQuery = `
        DELETE FROM [dbo].[Comment]
        WHERE id_comment = @id_comment
      `;
      await executeQuery(
        deleteCommentQuery,
        [commentId],
        ["id_comment"],
        false
      );

      res.redirect("back");
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      res.status(500).json({
        error: "Xóa bình luận không thành công",
        details: error.message,
      });
    }
  },

  getAllComments: async (req, res) => {
    try {
      const query = `
        SELECT c.*, u.username, a.heading as article_title 
        FROM [dbo].[Comment] c
        LEFT JOIN [dbo].[User] u ON c.id_user = u.id_user
        LEFT JOIN [dbo].[Article] a ON c.id_article = a.id_article
        ORDER BY c.day_created DESC
      `;
      const result = await executeQuery(query, [], [], false);
      res.json({
        success: "Lấy danh sách bình luận thành công",
        data: result.recordset,
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bình luận:", error);
      res.status(500).json({
        failed: "Lấy danh sách bình luận không thành công",
        error: error.message,
      });
    }
  },

  commentChild: async (req, res) => {
    const query = ` WITH UserCTE AS (
                        SELECT id_user
                        FROM [dbo].[User]
                        WHERE email = @email
                    ),
                    ArticleCTE AS (
                        SELECT id_article
                        FROM [dbo].[Article]
                        WHERE name_alias = @name_alias
                    )
                    INSERT INTO [dbo].[Comment]
                    SELECT
                        @id_comment,
                        u.id_user,
                        a.id_article,
                        @id_parent,
                        SYSDATETIMEOFFSET(),
                        @comment_content,
                        0
                    FROM UserCTE u
                    CROSS JOIN ArticleCTE a; `;
    console.log(req.body);
    const newId = await getLastRecordId();
    const values = [
      res.locals.email,
      req.params.id,
      newId,
      req.body.commentInp,
      req.body.parentCommentId,
    ];
    const paramNames = [
      "email",
      "name_alias",
      "id_comment",
      "comment_content",
      "id_parent",
    ];
    try {
      await executeQuery(query, values, paramNames, false);
      res.redirect("back");
    } catch (error) {
      res.json({ status: "false" });
    }
  },
};
