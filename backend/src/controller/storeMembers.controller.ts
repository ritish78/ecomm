import { Request, Response, NextFunction } from "express";
import { addMemberSchema } from "../schema/storeMembers.schema";
import { addMemberToStoreService } from "../services/store.service";

/**
 * @route               /stores/:storeId/members
 * @method              POST
 * @description         Add members to a store
 * @access              members:add
 */
export const addMembersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.storeId as string;

    const userInput = addMemberSchema.parse(req.body);

    const member = await addMemberToStoreService(storeId, userInput.email, userInput.roleId);

    return res.status(200).send({ message: "Member added successfully!", member });
  } catch (error) {
    next(error);
  }
};
