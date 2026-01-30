import { logout, register } from "@/controllers/auth/auth.controller";
import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/logout", logout);
