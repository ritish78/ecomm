import { Request, Response, NextFunction } from "express";
import {
  assignMemberRoleSchema,
  createRoleSchema,
  updateRolePermissionSchema,
  updateRoleSchema,
} from "../schema/role.schema";
import {
  assignMemberRoleService,
  createRoleForStoreService,
  deleteRoleByIdService,
  getStorePermissionCatalogService,
  updateRoleByIdService,
  updateRolePermissionService,
} from "../services/roles.service";
import { AuthError, BadRequestError } from "../utils/error";
import isUuid from "../utils/isUuid";

/**
 * @route               /api/v1/stores/:storeId/roles
 * @method              POST
 * @description         Create a new role in a store
 * @access              roles:create
 */
export const createRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    const userInput = createRoleSchema.parse(req.body);

    const role = await createRoleForStoreService(
      currentUserId,
      storeId,
      userInput.name,
      userInput.permissionKeys,
    );

    return res.status(201).send({ message: "Created a role successfully!", role });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/roles/:roleId/permission
 * @method              PATCH
 * @description         update the permission of a role of a store
 * @access              roles:update
 */
export const updateRolePermissionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    if (!roleId || !isUuid(roleId)) {
      throw new BadRequestError("Invalid role id provided!");
    }

    const userInput = updateRolePermissionSchema.parse(req.body);

    const role = await updateRolePermissionService(currentUserId, storeId, roleId, userInput.permissionKeys);

    return res.status(200).send({ message: "Updated role successfully!", role });
  } catch (error) {
    next(error);
  }
};

/**
 * @route                 /api/v1/stores/:storeId/roles/:roleId
 * @method                DELETE
 * @description           delete a role of a store
 * @access                roles:remove
 */
export const deleteRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    if (!roleId || !isUuid(roleId)) {
      throw new BadRequestError("Invalid role id provided!");
    }

    const role = await deleteRoleByIdService(roleId, currentUserId, storeId);

    return res.status(200).send({ message: `Role of id ${roleId} deleted successfully!`, role });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/roles/:roleId
 * @method              PATCH
 * @description         update the role of a store
 * @access              roles:update
 */
export const updateNameOfRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const roleId = req.params.roleId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    if (!roleId || !isUuid(roleId)) {
      throw new BadRequestError("Invalid role id provided!");
    }

    const toUpdateRoleInfo = updateRoleSchema.parse(req.body);

    const updatedRole = await updateRoleByIdService(roleId, storeId, toUpdateRoleInfo, currentUserId);

    return res.status(200).send({ message: `Role of id ${roleId} updated successfully!`, role: updatedRole });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/members/:userId/role
 * @method              PATCH
 * @description         Update the role assigned to a member of a store
 * @access              roles:assign
 */
export const assignMemberRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    //first, we check that the store and target user ids are valid uuids.
    //checking if they actually exist and if the user belongs to the store
    //will be handled in the service.
    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    if (!targetUserId || !isUuid(targetUserId)) {
      throw new BadRequestError("Invalid user id provided!");
    }

    const userInput = assignMemberRoleSchema.parse(req.body);

    //currentUserId is the user making the request while targetUserId is
    //the member whose role we want to change. The service checks whether
    //the current user can act on that member and assign the requested role.
    const member = await assignMemberRoleService(storeId, currentUserId, targetUserId, userInput.roleId);

    return res.status(200).send({ message: "Member role updated successfully!", member });
  } catch (error) {
    next(error);
  }
};

/**
 * @route               /api/v1/stores/:storeId/permissions
 * @method              GET
 * @description         Get all available permission keys for configuring store roles
 * @access              Store member or platform admin
 */
export const getStorePermissionCatalogController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;
    const currentUserId = req.user?.id;

    //there should be user because of our middleware but still making typescript happy
    if (!currentUserId) {
      throw new AuthError("Not logged in! Login in to continue!");
    }

    if (!storeId || !isUuid(storeId)) {
      throw new BadRequestError("Invalid store id provided!");
    }

    //this returns the available permissions from our permission table.
    //these are not the permissions assigned to the current user.
    //the service checks that the user is a member of this store or a
    //platform admin before returning the list.
    const permissions = await getStorePermissionCatalogService(storeId, currentUserId);

    return res.status(200).send({ message: "Available permissions retrieved successfully!", permissions });
  } catch (error) {
    next(error);
  }
};
