import UsersDao from '../daos/users.dao';
import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';



class UsersService implements CRUD {


    async create(resource: CreateUserDto) {
        return UsersDao.addUser(resource);
    }

    async deleteById(id: string) {
        return UsersDao.removeUserById(id);
    }

    async patchById(id: string, resource: PatchUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    }

    async putById(id: string, resource: PutUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    }

    async list(limit: number, page: number) {
        return UsersDao.getUsers(limit, page);
    }
    async readById(id: string) {
        return UsersDao.getUserById(id);
    }

    async getUserByUsername(email: string) {
        return UsersDao.getUserByUsername(email);
    }

    async getUserByUsernameWithPassword(email: string) {
        return UsersDao.getUserByUsernameWithPassword(email);
    }
}

export default new UsersService();
