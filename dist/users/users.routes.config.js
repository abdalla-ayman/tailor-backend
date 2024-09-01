"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const common_routes_config_1 = require("../common/common.routes.config");
const users_controllers_1 = __importDefault(require("./controllers/users.controllers"));
class UserRoutes extends common_routes_config_1.CommonRoutesConfig {
    constructor(app) {
        super(app, "UsersRoutes");
    }
    configureRoutes() {
        this.app
            .route("/users")
            .get(users_controllers_1.default.listUsers)
            .post(users_controllers_1.default.createUser);
        this.app
            .route("/users/:userId")
            .get(users_controllers_1.default.getUserById)
            .delete(users_controllers_1.default.removeUser)
            .put(users_controllers_1.default.put)
            .patch(users_controllers_1.default.patch);
        return this.app;
    }
}
exports.UserRoutes = UserRoutes;
