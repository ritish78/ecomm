import { Request, Response, NextFunction } from "express";
import { createRoleSchema, updateRolePermissionSchema } from "../schema/role.schema";
import { createRoleForStore, updateRolePermission } from "../services/roles.service";
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
    console.log("Creating role for store:", storeId, req.body.name);

    if (!storeId) {
      throw new BadRequestError(`Store of the provided id ${storeId} not found!`);
    }

    const userInput = createRoleSchema.parse(req.body);

    const role = await createRoleForStore(storeId, userInput.name, userInput.permissionKeys);

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
    const { storeId, roleId } = req.params;

    const userInput = updateRolePermissionSchema.parse(req.body);

    const role = await updateRolePermission(storeId as string, roleId as string, userInput.permissionKeys);

    return res.status(200).send({ message: "Updated role successfully!", role });
  } catch (error) {
    next(error);
  }
};
