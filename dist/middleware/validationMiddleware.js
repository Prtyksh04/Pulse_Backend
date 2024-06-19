import { ZodError } from "zod";
export function validatedata(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorMessage = error.errors.map((issue) => ({
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }));
                res.status(400).json({ error: "Invalid data", details: errorMessage });
            }
            else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };
}
