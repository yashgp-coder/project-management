import { prisma } from "../config/db.js";
import { inngest } from "../inngest/index.js";


// Create Task
export const createTask = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const { title, description, status, projectId, type, priority,assigneeId,due_date } = req.body;
        const origin = req.get('origin');

        // Check if the user is admin role in the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {members: {include: {user: true}}}
        })
        if(!project) {
            return res.status(404).json({ message: 'Project not found' });
        }else if(project.team_lead !== userId){
            return res.status(403).json({ message: 'Only team lead can create task' });
        }else if (assigneeId && !project.members.find((member)=> member.user.id === assigneeId)) {
            return res.status(400).json({ message: 'Assignee must be a member of the project' });
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                status,
                priority,
                assigneeId,
                type,
                due_date: new Date(due_date),
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        })

        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id,
                origin,
            }
        })

        res.status(201).json({task:taskWithAssignee, message:"Task created successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
        }
}

// Update Task
export const updateTask = async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        })
        if(!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const {userId} = await req.auth();
        
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: {members: {include: {user: true}}}
        })
        if(!project) {
            return res.status(404).json({ message: 'Project not found' });
        }else if(project.team_lead !== userId){
            return res.status(403).json({ message: 'Only team lead can update task' });
        }
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body
        })

        res.status(200).json({task:updatedTask, message:"Task updated successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

// Delete Task 
export const deleteTask = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {tasksIds} = req.body;
        
        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } }
        })

        if(tasks.length === 0) {
            return res.status(404).json({ message: 'Tasks not found' });
        }
        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: {members: {include: {user: true}}}
        })

        if(!project) {
            return res.status(404).json({ message: 'Project not found' });
        }else if(project.team_lead !== userId){
            return res.status(403).json({ message: 'Only team lead can delete task' });
        }

        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } }
        })
        res.status(200).json({ message:"Tasks deleted successfully"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}