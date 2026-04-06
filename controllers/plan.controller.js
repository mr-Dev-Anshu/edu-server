import { validationResult } from 'express-validator';
import { PlanService } from '../services/plan.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/AppError.js';

const planService = new PlanService();

export class PlanController {

    create = catchAsync(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError(errors.array().map(e => e.msg).join(', '), 422);
        }

        const data = await planService.createPlan({
            ...req.body,
            // createdBy: req.user.id,
        });

        res.status(201).json({ success: true, data });
    });

    getAll = catchAsync(async (req, res) => {
        const data = await planService.getAllPlans(req.query);
        res.status(200).json({ success: true, results: data.length, data });
    });

    getOne = catchAsync(async (req, res) => {
        const data = await planService.getPlanDetails(req.params.id);
        res.status(200).json({ success: true, data });
    });

    update = catchAsync(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new AppError(errors.array().map(e => e.msg).join(', '), 422);
        }

        const data = await planService.updatePlan(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    });

    updateStatus = catchAsync(async (req, res) => {
        const { isActive } = req.body;

        if (typeof isActive === 'undefined') {
            throw new AppError('isActive field is required (true or false)', 422);
        }

        if (typeof isActive !== 'boolean') {
            throw new AppError('isActive must be a boolean (true or false)', 422);
        }

        const { plan, message } = await planService.updatePlanStatus(
            req.params.id,
            isActive
        );

        res.status(200).json({ success: true, message, data: plan });
    });
}