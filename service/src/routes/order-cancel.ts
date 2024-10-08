import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  NotFoundError,
  requireAuth,
  validateRequest,
} from "@ebazdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { Order, OrderActions, OrderLogDoc, OrderLogType, OrderStatus } from "../shared";
import { OrderCancelledPublisher } from "../events/publisher/order-cancelled-publisher";

const router = express.Router();

router.post(
  "/cancel",
  [body("id").notEmpty().isString().withMessage("Order ID is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findOne({
        _id: req.body.id,
      });
      if (!order) {
        throw new NotFoundError();
      }
      order.status = OrderStatus.Cancelled;
      order.logs.push(<OrderLogDoc>{ userId: req.currentUser?.id, type: OrderLogType.Status, action: OrderActions.Cancel });
      await order.save();
      await new OrderCancelledPublisher(natsWrapper.client).publish(order);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: order });
    } catch (error: any) {
      await session.abortTransaction();

      console.error("order cancel operation failed", error);
      throw new BadRequestError("order cancel operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as orderCancelRouter };
