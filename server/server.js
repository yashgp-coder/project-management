import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {clerkMiddleware} from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from './routes/workspace.route.js';
import { protect } from './middlewares/auth.middleware.js';
import projectRouter from './routes/project.route.js';
import taskRouter from './routes/task.route.js';
import commentRouter from './routes/comment.route.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())

app.get('/', (req, res) => {
  res.send('Server is running');
})

app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect,workspaceRouter)
app.use("/api/projects", protect,projectRouter)
app.use("/api/tasks", protect,taskRouter)
app.use("/api/comments", protect,commentRouter)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});