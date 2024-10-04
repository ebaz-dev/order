import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Order } from "../shared";

const router = express.Router();

router.get(
  "/cart/get/order",
  [query("cartId").notEmpty().isString().withMessage("Cart ID is required")], currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const order = await Order.findOne({ cartId: req.query.cartId });
    res.status(StatusCodes.OK).send({ data: order });
  }
);

export { router as cartGetOrderRouter };
