// import multer from "multer";
// const upload = multer({
//     storage:multer.memoryStorage(),
// });
// export default upload;

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10, // Tối đa 10 file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and GIF images are allowed'));
    }
    cb(null, true);
  },
}).array('images', 10);

export default upload;
