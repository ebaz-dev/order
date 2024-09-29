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
    const criteria: any = {
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    if (req.query.merchantId) {
      criteria.merchantId = req.query.merchantId;
    }
    if (req.query.userId) {
      criteria.userId = req.query.userId;
    }
    if (req.query.status) {
      criteria.status = req.query.status;
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = await orderRepo.selectAndCountAll(criteria, options);

    res.status(StatusCodes.OK).send(result);
  }
);

export { router as orderListRouter };
