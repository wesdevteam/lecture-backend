import { register } from "@/controllers/auth/auth.controller";
import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", register);
