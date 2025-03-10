import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoute from "./routes/user.route.js";
import connectDB from './utils/db.js'
dotenv.config({});
const app = express(); // Gọi express() để khởi tạo ứng dụng

const PORT = process.env.PORT || 3000;
const dbUrl = process.env.MONGO_URL ;

// Kết nối MongoDB
connectDB(dbUrl);
// Định nghĩa route
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Hello, Express!',
    success: true,
  });
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Đúng cú pháp

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true, // Đúng cú pháp
};
app.use(cors(corsOptions));

app.use("/api/v1/user", userRoute);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
