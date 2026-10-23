import { usersService } from "../services/index.js"
import { logger } from "../utils/logger.js";
import asyncHandler from "../utils/asyncHandler.js";

const createUsersController = (service = usersService) => {
    const getAllUsers = asyncHandler(async (req, res) => {
        const users = await service.getAll();
        res.send({ status: "success", payload: users });
    });

    const getUser = asyncHandler(async (req, res) => {
        const user = await service.getUserById(req.params.uid);
        if (!user) {
            logger.error("No existe el usuario");
            return res.status(404).send({ status: "error", error: "User not found" });
        }
        res.send({ status: "success", payload: user });
    });

    const updateUser = asyncHandler(async (req, res) => {
        const user = await service.getUserById(req.params.uid);
        if (!user) return res.status(404).send({ status: "error", error: "User not found" });
        await service.update(req.params.uid, req.body);
        res.send({ status: "success", message: "User updated" });
    });

    const deleteUser = asyncHandler(async (req, res) => {
        const user = await service.getUserById(req.params.uid);
        if (!user) return res.status(404).send({ status: "error", error: "User not found" });
        await service.delete(req.params.uid);
        res.send({ status: "success", message: "User deleted" });
    });

    return { deleteUser, getAllUsers, getUser, updateUser };
};

export default createUsersController();
export { createUsersController };
