import { catchAsync } from '../../utils/catchAsync.js';

export class PermissionController {
  constructor({ permissionService }) {
    this.permissionService = permissionService;
  }

  create = catchAsync(async (req, res) => {
    const data = await this.permissionService.createPermission(req.body);

    res.status(201).json({
      success: true,
      data,
    });
  });
}
