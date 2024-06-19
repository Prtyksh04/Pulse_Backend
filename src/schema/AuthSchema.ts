import z from "zod";

export const AuthBody = z.object({
   username : z.string().optional(),
   password : z.string().optional(),
   mail : z.string().optional(),
   Google : z.string().optional(),
   Github : z.string().optional()
});
export type AuthBodyType = z.infer<typeof AuthBody>;


// username optional
//password optional  user can change it afterwards
//gmail optional
//Google auth     password field will be empty but user can make password for these fields.
// Github auth    password field will be empty but user can make password for these fields.
