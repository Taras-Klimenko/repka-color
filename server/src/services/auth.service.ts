import { prisma } from "./prisma";

import bcrypt from "bcrypt";

type RegisterUserData = {
  email: string;
  password: string;
  username: string;
};

type UserResponse = {
  id: number;
  email: string;
  username: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
};

export class AuthService {

  static async registerUser(data: RegisterUserData): Promise<UserResponse> {
    const { email, password, username } = data;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, username },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async findUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async verifyCredentials(
    email: string,
    password: string
  ): Promise<UserResponse | null> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password!);

    if (!isValidPassword) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async userExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user !== null;
  }

  static async getUserById(id: number): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
