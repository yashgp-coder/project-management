// Create Project

import { prisma } from "../config/db.js";

export const createProject = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {workspaceId,description,name,status,start_date,end_date,team_member,team_lead,progress,priority} = req.body;

        // Check if user has admin role for the workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {members : {include: {user: true}}}
        })

        if(!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if(!workspace.members.some((member)=> member.userId === userId && member.role === "ADMIN")) {
            return res.status(403).json({ message: "You do not have permission to create a project in this workspace" });
        }

        // Get the team lead using email
        const teamLead = await prisma.user.findUnique({
            where: { email: team_lead },
            select: { id: true }
        })

        const project = await prisma.project.create({
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                start_date: start_date? new Date(start_date) : null,
                end_date: end_date? new Date(end_date) : null,
                teamLeadId: teamLead?.id,
            }
        })

        // Add team members to the project
        if(team_member && team_member.length > 0) {
            const membersToAdd = [];
            workspace.members.forEach(member => {
                if(team_member.includes(member.user.email)) {
                    membersToAdd.push(member.user.id);
                }
            })

            await prisma.projectMember.createMany({
                data: membersToAdd.map(memberId => ({
                    projectId: project.id,
                    userId: memberId
                }))
            })
        }

        const projectWithMembers = await prisma.project.findUnique({
            where: { id: project.id },
            include: {
                members: {include: {user: true}},
                tasks: {include: {assignees: {include: {user: true}}}},
                owner: true
            }
        })

        res.status(201).json({project: projectWithMembers, message: "Project created successfully" });

    } catch (error) {
        console.log("Error creating project:", error);
        res.status(500).json({ message: "Error creating project", error });
    }
}

// Update Project
export const updateProject = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {id, workspaceId,description,name,status,start_date,end_date,team_member,team_lead,progress,priority} = req.body;
        // Check if user has admin role for the workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {members : {include: {user: true}}}
        })
        if(!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        if(!workspace.members.some((member)=> member.userId === userId && member.role === "ADMIN")) {
            const project = await prisma.project.findUnique({
                where: { id }
            })
            if(!project) {
                return res.status(404).json({ message: "Project not found" });
            }else if(project.teamLeadId !== userId) {
                return res.status(403).json({ message: "You do not have permission to update this project" });
            }
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                workspaceId,
                name,
                description,
                status,
                priority,
                progress,
                start_date: start_date? new Date(start_date) : null,
                end_date: end_date? new Date(end_date) : null
            }
        })

        res.status(200).json({project, message: "Project updated successfully" });

    }catch (error) {
        console.log("Error updating project:", error);
        res.status(500).json({ message: "Error updating project", error });
    }
}

// Add member to project
export const addMember = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const {projectId} = req.params;
        const {email} = req.body;

        // Check if user is project lead of the workspace
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {members: {include: {user: true}}}
        })
        if(!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        if(project.team_lead !== userId) {
            return res.status(404).json({ message: "Only project lead can add members to the project" });
        }
        const existingMember = project.members.find((member)=> member.email === email);

        if(existingMember) {
            return res.status(400).json({ message: "User is already a member of the project" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const member = await prisma.projectMember.create({
            data:{
                userId: user.id,
                projectId
            }
        })
        res.status(200).json({member, message: "Member added to project successfully" });

    }catch (error) {
        console.log("Error adding member to project:", error);
        res.status(500).json({ message: "Error adding member to project", error });
    }
}