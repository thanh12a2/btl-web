import { v2 as cloudinary } from "cloudinary";
import { executeQuery } from "../config/db.js";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";


async function getLastUserId() {
  const query = `SELECT TOP 1 id_user 
                 FROM [dbo].[User] 
                 ORDER BY id_user DESC`;
  
  try {
    const result = await executeQuery(query, [], [], false);
    
    if (result && result.recordset && result.recordset.length > 0) {
      const lastId = result.recordset[0].id_user;
      const lastNumber = parseInt(lastId.substring(1));
      return `U${String(lastNumber + 1).padStart(3, '0')}`;
    }
    return 'U001'; // Trả về ID đầu tiên nếu chưa có bản ghi nào
  } catch (error) {
    console.error("Lỗi khi lấy ID cuối cùng:", error);
    throw error;
  }
}

export const userController = {
  deleteUser: async (req, res) => {
    try {
      // Lấy id người dùng cần xóa từ request
      const userId = req.body["data-id"];

      //  Xóa tất cả comment của người dùng
      //  xóa tất cả comment con của các comment của người dùng
      const deleteChildCommentsQuery = `
        DELETE FROM [dbo].[Comment]
        WHERE id_parent IN (
          SELECT id_comment
          FROM [dbo].[Comment]
          WHERE id_user = @id_user
        )
      `;
      await executeQuery(
        deleteChildCommentsQuery,
        [userId],
        ["id_user"],
        false
      );

      // Xóa tất cả comment của người dùng
      const deleteCommentsQuery = `
        DELETE FROM [dbo].[Comment]
        WHERE id_user = @id_user
      `;
      await executeQuery(deleteCommentsQuery, [userId], ["id_user"], false);

      // Xóa tất cả LikeArticle của người dùng
      const deleteLikeArticlesQuery = `
        DELETE FROM [dbo].[LikeArticle]
        WHERE id_user = @id_user
      `;
      await executeQuery(deleteLikeArticlesQuery, [userId], ["id_user"], false);

      // Xóa tất cả ManageUser liên quan đến người dùng này
      const deleteManageUserQuery = `
        DELETE FROM [dbo].[ManageUser]
        WHERE id_user = @id_user OR id_admin = @id_user
      `;
      await executeQuery(deleteManageUserQuery, [userId], ["id_user"], false);

      // Xóa tất cả ManageComment liên quan đến người dùng (nếu là admin)
      const deleteManageCommentQuery = `
        DELETE FROM [dbo].[ManageComment]
        WHERE id_admin = @id_user
      `;
      await executeQuery(
        deleteManageCommentQuery,
        [userId],
        ["id_user"],
        false
      );

      //  Xóa tất cả ManageArticle liên quan đến người dùng (nếu là admin)
      const deleteManageArticleQuery = `
        DELETE FROM [dbo].[ManageArticle]
        WHERE id_admin = @id_user
      `;
      await executeQuery(
        deleteManageArticleQuery,
        [userId],
        ["id_user"],
        false
      );

      // Lấy role của người dùng
      const getRoleQuery = `
          SELECT role
          FROM [dbo].[User]
          WHERE id_user = @id_user
      `;
      const roleResult = await executeQuery(
        getRoleQuery,
        [userId],
        ["id_user"],
        false
      );

      const userRole = roleResult.recordset[0].role;

      if (userRole === "Admin" || userRole === "NhaBao") {
        // Nếu role là Admin hoặc NhaBao, cập nhật is_deleted thành 1
        const updateIsDeletedQuery = `
                UPDATE [dbo].[User]
                SET is_deleted = 1,
                    email = NULL
                WHERE id_user = @id_user
            `;
        await executeQuery(updateIsDeletedQuery, [userId], ["id_user"], false);
      } else if (userRole === "DocGia") {
        // Nếu role là DocGia, xóa người dùng
        const deleteUserQuery = `
                DELETE FROM [dbo].[User]
                WHERE id_user = @id_user
            `;
        await executeQuery(deleteUserQuery, [userId], ["id_user"], false);
      } else {
        res.status(400).json({ failed: "Role không hợp lệ" });
      }
      res.redirect("back");
      
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      res.status(500).json({ failed: "Xóa người dùng không thành công", error: error.message });
    }
  },
  
  addUser: async (req, res) => {
    try {
      // Lấy thông tin người dùng từ request body
      const { username, password, email, role } = req.body;

      console.log(req.body.username)
      
      // Kiểm tra xem email đã tồn tại chưa
      const checkEmailQuery = `
        SELECT COUNT(*) as count
        FROM [dbo].[User]
        WHERE email = @email
      `;
      const checkEmailValues = [email];
      const checkEmailParamNames = ["email"];
      const emailCheckResult = await executeQuery(checkEmailQuery, checkEmailValues, checkEmailParamNames, false);
      
      if (emailCheckResult.recordset[0].count > 0) {
        return res.status(400).json({ failed: "Email đã tồn tại trong hệ thống" });
      }
      
      // Tạo ID mới cho người dùng
      const id_user = await getLastUserId();
      
      // Thêm người dùng mới vào database
      const insertUserQuery = `
        INSERT INTO [dbo].[User] (id_user, username, password, email, role, is_deleted)
        VALUES (@id_user, @username, @password, @email, @role, 0)
      `;
      const insertUserValues = [id_user, username, password, email, role || 'DocGia'];
      const insertUserParamNames = ["id_user", "username", "password", "email", "role"];
      
      await executeQuery(insertUserQuery, insertUserValues, insertUserParamNames, false);
      
      res.redirect("back")
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      res.status(500).json({ failed: "Thêm người dùng không thành công", error: error.message });
    }
  },
  
  getAllUsers: async (req, res) => {
    try {
      const query = `
        SELECT id_user, username, email, role
        FROM [dbo].[User]
        WHERE is_deleted = 'False'
        ORDER BY id_user 
      `;
      const result = await executeQuery(query, [], [], false);
      res.json({ success: "Lấy danh sách người dùng thành công", data: result.recordset });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      res.status(500).json({ failed: "Lấy danh sách người dùng không thành công", error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      // Lấy id người dùng từ request query hoặc body
      const userId =  req.body["data-id"];
      
      if (!userId) {
        return res.status(400).json({ failed: "Thiếu thông tin ID người dùng" });
      }
      
      // Truy vấn thông tin chi tiết người dùng
      const query = `
        SELECT id_user, username, email, role
        FROM [dbo].[User]
        WHERE id_user = @id_user
      `;
      const values = [userId];
      const paramNames = ["id_user"];
      
      const result = await executeQuery(query, values, paramNames, false);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ failed: "Không tìm thấy người dùng" });
      }
      
      res.json({ 
        success: "Lấy thông tin người dùng thành công", 
        user: result.recordset[0] 
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      res.status(500).json({ failed: "Lấy thông tin người dùng không thành công", error: error.message });
    }
  },
  
  updateUser: async (req, res) => {
      try {
          // Lấy thông tin từ request body
          const userId = req.body.userId;
          const username = req.body.username;
          const password = req.body.password;
          const role = req.body.role;

          // Kiểm tra xem người dùng có tồn tại không
          const getUserQuery = `
              SELECT id_user, username, email, role, password
              FROM [dbo].[User]
              WHERE id_user = @id_user
          `;
          const getUserValues = [userId];
          const getUserParamNames = ["id_user"];

          const userResult = await executeQuery(getUserQuery, getUserValues, getUserParamNames, false);

          if (userResult.recordset.length === 0) {
              return res.status(404).json({ failed: "Không tìm thấy người dùng cần cập nhật" });
          }

          // Lấy thông tin hiện tại của người dùng
          const currentUser = userResult.recordset[0];

          // Nếu không có giá trị mới, giữ lại giá trị cũ
          const updatedUsername = username || currentUser.username;
          const updatedPassword = password || currentUser.password;
          const updatedRole = role || currentUser.role;

          // Luôn giữ email hiện tại, không cho phép thay đổi
          const email = currentUser.email;

          // Cập nhật thông tin người dùng
          const updateQuery = `
              UPDATE [dbo].[User]
              SET username = @username,
                  password = @password,
                  role = @role
              WHERE id_user = @id_user
          `;
          const updateValues = [updatedUsername, updatedPassword, updatedRole, userId];
          const updateParamNames = ["username", "password", "role", "id_user"];

          // Thực hiện cập nhật
          await executeQuery(updateQuery, updateValues, updateParamNames, false);

          // Tạo JWT mới với thông tin đã cập nhật
          const updatedUser = {
              username: updatedUsername,
              email: email,
              role: updatedRole,
          };

          const newToken = jwt.sign(updatedUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "8h" });

          // Set lại cookie với JWT mới
          res.cookie("user", newToken, {
              httpOnly: true,
              maxAge: 8 * 60 * 60 * 1000, // 8 giờ
          });

          res.redirect("back");
      } catch (error) {
          console.error("Lỗi khi cập nhật thông tin người dùng:", error);
          res.status(500).json({ failed: "Cập nhật thông tin người dùng không thành công", error: error.message });
      }
  },

 searchUsers: async (req, res) => {
    try {
        const searchQuery = req.body.searchInp || ""; // Lấy từ khóa tìm kiếm từ form
        console.log("Từ khóa tìm kiếm:", searchQuery);

        const query = `
            SELECT id_user, username, email, password, role
            FROM [dbo].[User]
            WHERE 
                (id_user LIKE @searchQuery OR
                username LIKE @searchQuery OR
                email LIKE @searchQuery OR
                password LIKE @searchQuery OR
                role LIKE @searchQuery)
                AND is_deleted = 'False'
        `;
        const values = [`%${searchQuery}%`]; // Thêm ký tự `%` để tìm kiếm chuỗi con
        const paramNames = ["searchQuery"];

        const result = await executeQuery(query, values, paramNames, false);

        // Render lại trang admin.ejs với kết quả tìm kiếm
        res.render("admin.ejs", {
            user: result.recordset, // Truyền danh sách người dùng tìm được
            pagination: { users: { totalPages: 1, currentPage: 1 } }, // Cập nhật pagination nếu cần
        });
    } catch (error) {
        console.error("Lỗi khi tìm kiếm người dùng:", error);
        res.status(500).send("Đã xảy ra lỗi khi tìm kiếm người dùng.");
    }
}

};


