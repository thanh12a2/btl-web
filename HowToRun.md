Step 1: Tạo 1 file .env ( đặt chính xác tên file là .env, không có gì trước dấu chấm, btl-web/.env ). File có nội dung như sau ( có thể paste vào )
        DB_USER = admin // config tên
        DB_PASSWORD = 123 // config mật khẩu 
        DB_SERVER = localhost
        DB_DATABASE = NewsWebsite

        ACCESS_TOKEN_SECRET = 637d35c4eff3c2fb83dd0b6831d3e917d85b0381f6471643e2ac842d23f06f6ba391f244a2c6b7a01322909c42c62b20dc1db333da08c3e721bec57194140151
        REFRESH_TOKEN_SECRET = 36a759ac28b9450e48a189b039980e20efe2fcbd3379b1903c309985845ec809bbf54a1efc327e56b3f56adb66fbc8063ee4bdc3c7986c73b2f78bff8c20ab22

        CLOUDINARY_API_KEY = "978976946511161"
        CLOUDINARY_API_SECRET = "pckao9MuBWX-pO3lPBuEJswkYlM"

        EMAIL_SENDER = "theptitnewspaper@gmail.com"
        EMAIL_PASSWORD = "glur xknn bkze jbrx"

        ACCESS và REFRESH token có thể copy từ trên hoặc dùng lệnh node sau để gen ra 
        > node
        > require('crypto').randomBytes(64).toString('hex')

Step 2: cài đặt các package sau ( vào package.json cài hết packages trong dependencies)
        npm i express axios body-parser cors mssql cookie-parser dotenv jsonwebtoken nodemon node-cache ejs 

Step 3: Dùng các lệnh npm start hoặc node index.js hoặc nodemon index.js để chạy
