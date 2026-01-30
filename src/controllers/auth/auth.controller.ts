import { findAccountS, registerS } from "@/services/auth/auth.service";
import { hashPassword } from "@/utils/bcrypt/bcrypt.util";
import { AppError } from "@/utils/error/app-error.util";
import generateToken from "@/utils/jwt/generate-token";
import { Request, Response } from "express";

export const register = async (req: Request, res: Response): Promise<void> => {
  // 1. Get the data front the frontend
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
