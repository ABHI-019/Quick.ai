import express from 'express';
import { auth } from '../middlewares/auth.js';
import { generateArticle, generateBlogTitle, generateImage, removeImagebackground, removeImageOject, resumeReview } from '../controllers/aiController.js';
import { upload } from '../config/multer.js';

const aiRouter = express.Router();

aiRouter.post('/generate-article',auth,generateArticle);
aiRouter.post('/generate-blog-title',auth,generateBlogTitle);
aiRouter.post('/generate-image',auth,generateImage);
aiRouter.post('/remove-image-background',upload.single('image'),auth,removeImagebackground);
aiRouter.post('/remove-image-object',upload.single('image'),auth,removeImageOject);
aiRouter.post('/resume-review',upload.single('resume'),auth,resumeReview);





export default aiRouter;