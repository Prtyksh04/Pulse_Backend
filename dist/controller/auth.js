export const SignUp = async (req, res, next) => {
    // const {username , email , password, picturePath , requestType} = req.body;
    const { requestType } = req.body;
    // let hashedPassword;
    // try {
    //     }
    //     switch (requestType) {
    //         case "Email-password":
    //             if(!email || !password){
    //                 throw createHttpError(400 , "Email and Password  are Required");
    //             }
    //             hashedPassword = await hashPassword(password);
    //             //create jwt token 
    //             //store the info in the database;
    //             //send response
    //             res.send("success");
    //             break;
    //         case "Email-username-Password":
    //             if (!username || !email || !password) {
    //                 throw createHttpError(400 , "Fields are required");
    //             }
    //             hashedPassword = await hashPassword(password);
    //             //create jwt token 
    //             //store the info in the database;
    //             //send response
    //             res.send("success");
    //             break;
    //         case "Github Auth":
    //             //github Auth implementation here
    //             break;
    //         case "Google Auth":
    //             //google Auth implementation here
    //             break;
    //         default:
    //             break;
    //     }
    // } catch (error) {
    //     next(error);
    // }
};
