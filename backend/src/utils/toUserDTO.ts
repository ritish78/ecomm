import { User } from "../models/user.model";

const toUserDTO = (user: User) => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    googleId: user.googleId,
    emailVerified: user.emailVerified,
    active: user.active,
  };
};

export default toUserDTO;
