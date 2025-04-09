import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoute from './routes/user.route.js';
import postRoute from './routes/post.route.js';
import messageRoute from './routes/message.route.js';
import connectDB from './utils/db.js';
import { app, server } from './socket/socket.js';
dotenv.config({});

// const app = express();

const PORT = process.env.PORT || 8080; // Đồng bộ với 8080
const dbUrl = process.env.MONGO_URL;

// Kết nối MongoDB
connectDB(dbUrl);

// Route cơ bản
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Hello, Express!',
    success: true,
  });
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use('/api/v1/user', userRoute);
app.use('/api/v1/post', postRoute);
app.use('/api/v1/message', messageRoute);

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
