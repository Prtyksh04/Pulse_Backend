import z from "zod";
export const AuthBody = z.object({
    username: z.string().optional(),
    password: z.string(),
    email: z.string().optional(),
    Google: z.string().optional(),
    Github: z.string().optional(),
    projectName: z.string(),
    apiKey: z.string()
}).refine((data) => data.username || data.Google || data.Github, {
    message: "At least one of 'Username' , 'Google' , or 'Github'  must be provided",
    path: ["username", "Google", "Github"]
});
