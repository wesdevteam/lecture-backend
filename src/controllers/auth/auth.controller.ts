import { findAccountS, registerS } from "@/services/auth/auth.service";
import { comparePassword, hashPassword } from "@/utils/bcrypt/bcrypt.util";
import { AppError } from "@/utils/error/app-error.util";
import generateToken from "@/utils/jwt/generate-token";
import { Request, Response } from "express";

export const register = async (req: Request, res: Response) => {
  // 1. Get the frontend data
  const { name, email, password } = req.body;

  // 2. Check if all data has value
  // Per-field validation approach
  //   if (!name) throw new AppError("Name is required.", 400);
  //   if (!email) throw new AppError("Email is required.", 400);
  //   if (!password) throw new AppError("Password is required.", 400);

  // Single-condition validation approach
  if (!name || !email || !password)
    throw new AppError("All field are required.", 400);

  // 3. Check if account is already exist
  if (await findAccountS({ email })) {
    throw new AppError("Email already exist.", 409);
  }

  // 4. Hash password
  const hashedPassword = await hashPassword(password);

  // 5. Create account
  const account = await registerS({
    name,
    email,
    password: hashedPassword,
  });

  // 6. Generate token and save to cookie
  generateToken(account._id, res);

  // 7. Return response
  res.status(200).json({ message: "Account registered successfully." });
};

export const login = async (req: Request, res: Response) => {
  // 1. Get the frontend data
  const { email, password } = req.body;

  // 2. Check if all data has value
  // Per-field validation approach
  //   if (!email) throw new AppError("Email is required.", 400);
  //   if (!password) throw new AppError("Password is required.", 400);

  // Single-condition validation approach
  if (!email || !password) throw new AppError("All field are required.", 400);

  // 3. Check if account exist
  const account = await findAccountS({ email });
  if (!account) throw new AppError("Account not found.", 404);

  // 4. Check if password is correct
  const correctPassword = await comparePassword(password, account.password);
  if (!correctPassword) throw new AppError("Incorrect password.", 400);

  // 5. Generate token
  generateToken(account._id, res);

  // 6. Return respons
  res.status(200).json({ message: "Login successfuly." });
};

export const logout = (req: Request, res: Response) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};
