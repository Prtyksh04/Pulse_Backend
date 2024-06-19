import z from "zod";
export const projectBody = z.object({
    applicationName: z.string(),
    signupType: z.string()
});
