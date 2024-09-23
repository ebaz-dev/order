import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Order } from "../shared";

const router = express.Router();

router.get(
  "/order/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  validateRequest,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.query.id);
    res.status(StatusCodes.OK).send(order);
  }
);

export { router as orderGetRouter };
