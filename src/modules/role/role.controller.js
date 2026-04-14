import { catchAsync } from '../../utils/catchAsync.js';

export class RoleController {
  constructor({ roleService }) {
    this.roleService = roleService;
  }

  create = catchAsync(async (req, res) => {
    const data = await this.roleService.createRole(req.body);

    res.status(201).json({
      success: true,
      data,
    });
  });
}
