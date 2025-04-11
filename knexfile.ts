import { Client } from "knex";

export default {
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    user: "rootroot",
    password: "new_password",
    database: "lets_swap",
    charset: "utf8",
  },
};
