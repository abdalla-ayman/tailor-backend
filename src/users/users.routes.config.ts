import express from "express";
import { CommonRoutesConfig } from "../common/common.routes.config";
import UsersControllers from "./controllers/users.controllers";

export class UserRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, "UsersRoutes");
    }

    configureRoutes() {
        this.app
            .route("/users")
            .get(UsersControllers.listUsers)
            .post(UsersControllers.createUser);
        this.app
            .route("/users/:userId")
            .get(UsersControllers.getUserById)
            .delete(UsersControllers.removeUser)
            .put(UsersControllers.put)
            .patch(UsersControllers.patch);
        return this.app;
    }
}
