import express from 'express';
import { createTask, deleteTask, updateTask } from '../controllers/task.controller.js';
import e from 'express';

const taskRouter = express.Router();
taskRouter.post('/', createTask);
taskRouter.put('/:id', updateTask);
taskRouter.post('/delete', deleteTask);

export default taskRouter;