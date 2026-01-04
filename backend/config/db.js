import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("successfully conected to mongodb.");

  } catch (error) {
    console.error("Cannont connect to database errror:", error);
    // process.exit(1); 
  }
}

export default connectDB;