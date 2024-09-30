import express, { Request, Response } from "express";
import { currentUser, QueryOptions, requireAuth, validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Order } from "../shared";
import { orderRepo } from "../repository/order.repo";

const router = express.Router();

router.get(
  "/list",
  validateRequest, currentUser, requireAuth,
  async (req: Request, res: Response) => {
    const query: any = req.query;
    const criteria: any = {
    };
    if (query.supplierId) {
      criteria.supplierId = query.supplierId;
    }
    if (query.merchantId) {
      criteria.merchantId = query.merchantId;
    }
    if (query.userId) {
      criteria.userId = query.userId;
    }
    if (query.status) {
      criteria.status = query.status;
    }
    if (query.startDate) {
      criteria["createdAt"] = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      if (query.startDate) {
        criteria["createdAt"] = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
      } else {
        criteria["createdAt"] = { $lte: new Date(query.endDate) };
      }
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = await orderRepo.selectAndCountAll(criteria, options);

    res.status(StatusCodes.OK).send(result);
  }
);

export { router as orderListRouter };
