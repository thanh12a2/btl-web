import { executeQuery } from "../config/db.js";

export const statsController = {
  topArticles: async (req, res) => {
    try {
      const { duration, number_time, how_much } = req.body;

      const allowedDurations = {
        year: "year",
        month: "month",
        week: "week",
      };

      const datePart = allowedDurations[duration];

      if (!datePart) {
        return res
          .status(400)
          .json({
            error:
              "Loại duration không hợp lệ. Chỉ chấp nhận: year, month, week.",
          });
      }

      // Kiểm tra tham số how_much có hợp lệ không
      if (!how_much || isNaN(how_much) || how_much <= 0) {
        return res
          .status(400)
          .json({ error: "Tham số how_much phải là một số nguyên dương." });
      }

      const query = `
            SELECT TOP (@how_much)
                A.id_article,
                A.heading,
                A.views,
                A.like_count,
                COUNT(C.id_comment) AS comment_count,
                (A.views * 1 + COUNT(C.id_comment) * 2 + A.like_count * 2) AS interaction_score
            FROM
                [dbo].[Article] A
            LEFT JOIN [dbo].[Comment] C ON A.id_article = C.id_article
            WHERE
                A.day_created >= DATEADD(${datePart}, -@number_time, GETDATE())
            GROUP BY
                A.id_article, A.heading, A.views, A.like_count
            ORDER BY
                interaction_score DESC;
          `;

      const result = await executeQuery(
        query,
        [number_time, how_much],
        ["number_time", "how_much"],
        false
      );

      return res.json({ success: "Thành công", data: result.recordset });
    } catch (error) {
      console.error("Lỗi truy vấn topArticles:", error);
      return res
        .status(500)
        .json({
          failed: "Không thành công! Có lỗi xảy ra.",
          error: error.message,
        });
    }
  },

  mostApprovedJournalist: async (req, res) => {
    try {
      const { how_much, duration, number_time } = req.body;

      // Kiểm tra tham số how_much có hợp lệ không
      if (!how_much || isNaN(how_much) || how_much <= 0) {
        return res
          .status(400)
          .json({ error: "Tham số how_much phải là một số nguyên dương." });
      }

      // Kiểm tra tham số duration có hợp lệ không
      const allowedDurations = {
        year: "year",
        month: "month",
        week: "week",
      };

      const datePart = allowedDurations[duration];
      if (!datePart) {
        return res
          .status(400)
          .json({
            error:
              "Loại duration không hợp lệ. Chỉ chấp nhận: year, month, week.",
          });
      }

      // Kiểm tra tham số number_time có hợp lệ không
      if (!number_time || isNaN(number_time) || number_time <= 0) {
        return res
          .status(400)
          .json({ error: "Tham số number_time phải là một số nguyên dương." });
      }

      const query = `
                SELECT TOP (@how_much)
                    J.id_user,
                    J.username,
                    COUNT(A.id_article) AS approved_articles_count
                FROM 
                    [dbo].[User] J
                JOIN 
                    [dbo].[Article] A ON J.id_user = A.id_user
                WHERE 
                    A.status = N'Đã duyệt' 
                    AND (J.role = N'NhaBao' OR J.role = N'Admin')
                    AND A.day_created >= DATEADD(${datePart}, -@number_time, GETDATE())
                GROUP BY 
                    J.id_user, J.username
                ORDER BY 
                    approved_articles_count DESC;
            `;

      const result = await executeQuery(
        query,
        [how_much, number_time],
        ["how_much", "number_time"],
        false
      );

      return res.json({ success: "Thành công", data: result.recordset });
    } catch (error) {
      console.error("Lỗi truy vấn mostApprovedJournalist:", error);
      return res
        .status(500)
        .json({
          failed: "Không thành công! Có lỗi xảy ra.",
          error: error.message,
        });
    }
  },

  topArticlesFrontPage: async () => {
    try {
      // const { duration, number_time, how_much } = req.body;

      const duration = "year"
      const how_much = "9"
      const number_time = "2"

      const allowedDurations = {
        year: "year",
        month: "month",
        week: "week",
      };

      const datePart = allowedDurations[duration];

      if (!datePart) {
        return res
          .status(400)
          .json({
            error:
              "Loại duration không hợp lệ. Chỉ chấp nhận: year, month, week.",
          });
      }

      // Kiểm tra tham số how_much có hợp lệ không
      if (!how_much || isNaN(how_much) || how_much <= 0) {
        return res
          .status(400)
          .json({ error: "Tham số how_much phải là một số nguyên dương." });
      }

      const query = `
            SELECT TOP (@how_much)
                A.id_article,
                A.heading,
                A.views,
                A.like_count,
                COUNT(C.id_comment) AS comment_count,
                (A.views * 1 + COUNT(C.id_comment) * 2 + A.like_count * 2) AS interaction_score
            FROM
                [dbo].[Article] A
            LEFT JOIN [dbo].[Comment] C ON A.id_article = C.id_article
            WHERE
                A.day_created >= DATEADD(${datePart}, -@number_time, GETDATE())
            GROUP BY
                A.id_article, A.heading, A.views, A.like_count
            ORDER BY
                interaction_score DESC;
          `;

      const result = await executeQuery(
        query,
        [number_time, how_much],
        ["number_time", "how_much"],
        false
      );

      return result
    } catch (error) {
      console.error("Lỗi truy vấn topArticles:", error);
      return res
        .status(500)
        .json({
          failed: "Không thành công! Có lỗi xảy ra.",
          error: error.message,
        });
    }
  },
};
