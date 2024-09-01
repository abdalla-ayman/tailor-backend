"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_service_1 = __importDefault(require("../../common/services/mongoose.service"));
const debug_1 = __importDefault(require("debug"));
const log = (0, debug_1.default)("app:in-memory-dao");
class UsersDao {
    constructor() {
        this.Schema = mongoose_service_1.default.getMongoose().Schema;
        this.userSchema = new this.Schema({
            username: String,
            password: { type: String, select: false },
            firstName: String,
            lastName: String,
            admin: Boolean,
        }, { id: false });
        this.User = mongoose_service_1.default.getMongoose().model("Users", this.userSchema);
        log("Created new instance of UsersDao");
    }
    addUser(userFields) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield new this.User(Object.assign(Object.assign({}, userFields), { admin: false }));
            yield user.save();
            return user.id;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.User.findOne({
                username,
            }).exec();
            return user;
        });
    }
    getUserByUsernameWithPassword(username) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.User.findOne({
                username,
            }).select('+password').exec();
            return user;
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.User.findById(id).exec();
            return user;
        });
    }
    getUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 25, page = 0) {
            return this.User.find({})
                .limit(limit)
                .skip(limit * page)
                .exec();
        });
    }
    updateUserById(userId, userFields) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.User.findOneAndUpdate({ _id: userId }, { $set: userFields }, { new: true }).exec();
            return existingUser;
        });
    }
    removeUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.User.deleteOne({ _id: userId }).exec();
        });
    }
}
exports.default = new UsersDao();
