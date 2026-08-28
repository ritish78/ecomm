import { Request, Response, NextFunction } from "express";
import { createRoleSchema, updateRolePermissionSchema, updateRoleSchema } from "../schema/role.schema";
import {
  createRoleForStoreService,
  deleteRoleByIdService,
  updateRoleByIdService,
  updateRolePermissionService,
} from "../services/roles.service";
import { BadRequestError } from "../utils/error";

/**
 * @route               /stores/:storeId/roles
 * @method              POST
 * @desccription        Create a new role in a store
 * @access              roles:create
 */
export const createRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;

    if (!storeId) {
      throw new BadRequestError(`Store of the provided id ${storeId} not found!`);
    }

    const userInput = createRoleSchema.parse(req.body);

    const role = await createRoleForStoreService(storeId, userInput.name, userInput.permissionKeys);

    return res.status(201).send({ message: "Created a role successfully!", role });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /stores/:storeId/roles/:roleId/permission
 * @method              PATCH
 * @description         update the permission of a role of a store
 * @access              roles:update
 */
export const updateRolePermissionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;

    const userInput = updateRolePermissionSchema.parse(req.body);

    const role = await updateRolePermissionService(userId, storeId, roleId, userInput.permissionKeys);

    return res.status(200).send({ message: "Updated role successfully!", role });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                 /stores/:storeId/roles/:roleId
 * @method                DELETE
 * @description           delete a role of a store
 * @access                roles:delete
 */
export const deleteRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    const userId = req.user?.id as string;

    const role = await deleteRoleByIdService(roleId, userId, storeId);

    return res.status(200).send({ message: `Role of id ${roleId} deleted successfully!`, role })
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /stores/:storeId/roles/:roleId
 * @method              PATCH
 * @description         update the role of a store
 * @access              roles:update
 */
export const updateNameOfRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    
    const toUpdateRoleInfo = updateRoleSchema.parse(req.body);

    const updatedRole = await updateRoleByIdService(roleId, storeId, toUpdateRoleInfo);

    return res.status(200).send({ message: `Role of id ${roleId} updated successfully!`, role: updatedRole })
  } catch (error) {
    next(error);
  }
}
