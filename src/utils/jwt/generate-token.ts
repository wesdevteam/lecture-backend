import type { Response } from "express";
import jwt from "jsonwebtoken";

const generateToken = (accountId: string, res: Response) => {
  const token = jwt.sign({ accountId }, process.env.JWT_SECRET as string, {
    expiresIn: "15d",
  });

  res.cookie("token", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export default generateToken;
