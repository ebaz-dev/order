import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Order } from "../shared";

const router = express.Router();

router.get(
  "/list",
  validateRequest,
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
    const orders = await Order.find(criteria);

    res.status(StatusCodes.OK).send({ data: orders, total: orders.length });
  }
);

export { router as orderListRouter };
