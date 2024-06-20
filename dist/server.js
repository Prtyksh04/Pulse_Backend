import express from "express";
import PulseAuthRouter from "./router/pulseAuthRouter.js";
import createApplicationRouter from "./router/createApplicationRouter.js";
import AuthRouter from "./router/AuthRouter.js";
import "dotenv/config";
//middlewares
const app = express();
app.use(express.json());
//routers
app.use("/auth", PulseAuthRouter);
app.use("/dashboard", createApplicationRouter);
app.use("/client", AuthRouter);
app.get("/", (req, res) => {
    res.send("hello strated with typescript");
});
app.listen(process.env.PORT, () => {
    console.log("Server is Running on port : " + process.env.PORT);
});
