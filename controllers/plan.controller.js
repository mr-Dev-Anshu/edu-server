import { PlanService } from '../services/plan.service.js';
import { catchAsync } from '../utils/catchAsync.js';

const planService = new PlanService();

export class PlanController {

    create = catchAsync(async (req, res) => {
        const data = await planService.createPlan({
            ...req.body,
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
        const data = await planService.updatePlan(req.params.id, req.body);
        res.status(200).json({ success: true, data });
    });

    updateStatus = catchAsync(async (req, res) => {
        const { isActive } = req.body;
        const { plan, message } = await planService.updatePlanStatus(
            req.params.id,
            isActive
        );

        res.status(200).json({ success: true, message, data: plan });
    });
}