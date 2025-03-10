import mongoose from 'mongoose';

const connectDB = async (dbUrl) => {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Dừng server nếu kết nối thất bại
  }
};

export default connectDB;
