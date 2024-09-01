import mongooseService from "../../common/services/mongoose.service";
import { CreateUserDto } from "../dtos/create.user.dto";
import { PutUserDto } from "../dtos/put.user.dto";
import { PatchUserDto } from "../dtos/patch.user.dto";

import debug from "debug";

const log: debug.IDebugger = debug("app:in-memory-dao");

class UsersDao {
    Schema = mongooseService.getMongoose().Schema;
    userSchema = new this.Schema(
        {
            username: String,
            password: { type: String, select: false },
            firstName: String,
            lastName: String,
            admin: Boolean,
        },
        { id: false }
    );
    User = mongooseService.getMongoose().model("Users", this.userSchema);

    constructor() {
        log("Created new instance of UsersDao");
    }

    async addUser(userFields: CreateUserDto) {
        let user = await new this.User({
            ...userFields,
            admin: false,
        });
        await user.save();
        return user.id;
    }

    async getUserByUsername(username: string) {
        let user = await this.User.findOne({
            username,
        }).exec();

        return user;
    }

    async getUserByUsernameWithPassword(username: string) {
        let user = await this.User.findOne({
            username,
        }).select('+password').exec();

        return user;
    }

    async getUserById(id: string) {
        let user = await this.User.findById(id).exec();
        return user;
    }

    async getUsers(limit = 25, page = 0) {
        return this.User.find({})
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    async updateUserById(
        userId: string,
        userFields: PatchUserDto | PutUserDto
    ) {
        const existingUser = await this.User.findOneAndUpdate(
            { _id: userId },
            { $set: userFields },
            { new: true }
        ).exec();

        return existingUser;
    }

    async removeUserById(userId: string) {
        return this.User.deleteOne({ _id: userId }).exec();
    }

}


export default new UsersDao()