import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new PrismaMariaDb({
      database: "braincloud",
      password: "root",
      user: "root",
    });
    super({ adapter: pool });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
