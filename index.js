import express from 'express'; 
import axios from 'axios'; 
import bodyParser from 'body-parser';
import cors from 'cors'; 
import sql from 'mssql'; 
import cookieParser from 'cookie-parser'; 
import dotenv from 'dotenv'; 
import jwt from "jsonwebtoken";

// Khai báo các route
import { router as mainRoutes } from "./routes/mainRoute.js"; // Route chính
import { router as authRoutes } from "./routes/authRoute.js"; // Route xác thực
import { router as itemRoutes } from "./routes/articleItems.js"; // Route cho tất cả item bao gồm article, category, user
import { router as categoryRoutes } from "./routes/categoryRoute.js"; // Route cho tất cả item bao gồm article, category, user
import { router as articleRoutes } from "./routes/getArticle.js"; // Route cho tất cả item bao gồm article, category, user
import { router as paginationRoutes } from "./routes/paginationRoute.js"; // Route cho tất cả item bao gồm article, category, user
import { router as testRoutes } from "./routes/testRoute.js"; // Route cho tất cả item bao gồm article, category, user
import { router as uploadRoutes } from "./routes/uploadPics.js"; // Route cho tất cả item bao gồm article, category, user
import { router as statsRoutes} from "./routes/statsRoute.js"
import { authController } from "./controllers/authController.js"; // Import controller cho xác thực
import { connect } from "./config/db.js"; 
import { router as commentItems } from "./routes/commentItems.js";
import { articleController } from './controllers/articleController.js';
import { router as userRoutes } from "./routes/userRoute.js"; // Route cho user

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(authController.authenticateToken);
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('public')); 



app.use("", mainRoutes); 
app.use("/auth", authRoutes);
app.use("/api", itemRoutes);
app.use("/category", categoryRoutes);
app.use("/article", articleRoutes);
app.use("/pagination", paginationRoutes);
app.use("/test", testRoutes); // Route cho tất cả item bao gồm article, category, user
app.use("/upload", uploadRoutes); // Route cho tất cả item bao gồm article, category, user
app.use("/comment", commentItems); 
app.use("/user", userRoutes); // Route cho user
app.use("/stats", statsRoutes); // Route cho số liệu thống kê

// Kết nối đến cơ sở dữ liệu SQL Server
connect()
  .then((connection) => {
    console.log("Connected to the database.");
  })
  .catch((error) => {
    console.log("Database connection failed!");
    console.log(error);
  });

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});






