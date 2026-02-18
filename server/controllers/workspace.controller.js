import { prisma } from "../config/db.js";

// Controller to get all workspaces for a user
export const getUserWorkspaces = async (req, res) => {
    try {
        const {userId} = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {some: {userId:userId}}
            },
            include:{
                members:{ include: { user: true}},
                projects: {
                    include: { tasks: {include: { assignee: true, comments : {include: { user: true} } }},
                    members: { include: { user: true} }
                }
                },
                owner: true
            }
        });
        res.json({workspaces});
    } catch (error) {
        console.log("Error fetching workspaces:", error);
        res.status(500).json({message: error.code || error.message });
    }
}

// Add member to workspace
export const addMember= async (req, res) => {
    try {
        const {userId} = await req.auth();
        const { email, role , workspaceId, message } = req.body;

        const user = await prisma.user.findUnique({where: {email}});
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        
        if(!workspaceId || !role){
            return res.status(400).json({message: "Workspace ID and role are required"});
        }

        if(!["ADMIN", "MEMBER"].includes(role)){
            return res.status(400).json({message: "Role must be either ADMIN or MEMBER"});
        }
        //fetch workspace
        const workspace = await prisma.workspace.findUnique({where: {id: workspaceId}, include: {members: true}});

        if(!workspace){
            return res.status(404).json({message: "Workspace not found"});
        }

        //Check creator has admin rights
        if(!workspace.members.find((member)=> member.userId === userId && member.role === "ADMIN")){
            return res.status(401).json({message: "Only workspace admins can add members"});
        }

        //Check if user is already a member
        const existingMember = workspace.members.find((member) => member.userId === userId);
        if(existingMember){
            return res.status(400).json({message: "User is already a member of the workspace"});
        }

        const member= await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        })

        res.json({message: "Member added successfully", member});
    } catch (error) {
        console.log("Error fetching workspaces:", error);
        res.status(500).json({message: error.code || error.message });
    }
}