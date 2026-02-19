import { prisma } from "../config/db.js";

// Add comment to a task
export const addComment = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {taskId, content} = req.body;
        // Check if user is part of the project that the task belongs to
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        })
        if (!task) {
            return res.status(404).json({error: "Task not found"});
        }
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: {include: { user: true } } }
        })
        if (!project) {
            return res.status(404).json({error: "Project not found"});
        }

        const member = project.members.find(member => member.userId === userId);
        if (!member) {
            return res.status(403).json({error: "User is not the memnber of the project"});
        }

        const comment = await prisma.comment.create({
            data: {
                taskId,
                content,
                userId
            },
            include: {user: true}
        })
        res.status(201).json({comment, message:"Comment added successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to add comment"});
    }
}

// Get comments for a task
export const getTaskComments = async (req, res) => {
    try {
        const {taskId} = req.params;
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: { user: true }
        })
        res.status(200).json({comments});
    }catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to get comments"});
    }
}