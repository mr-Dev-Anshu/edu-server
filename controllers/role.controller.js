import { RoleService } from "../services/role.service.js";
import { catchAsync } from "../utils/catchAsync.js";

const roleService = new RoleService();

export class RoleController {
  create = catchAsync(async (req, res) => {
    const data = await roleService.createRole(req.body);
    res.status(201).json({ success: true, data });
  });
}
