import express from 'express';
import { addComment, getTaskComments } from '../controllers/comment.controller.js';

const commentRouter = express.Router();

commentRouter.post('/', addComment);
commentRouter.get('/:taskId', getTaskComments);

export default commentRouter;