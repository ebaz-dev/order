import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
} from "@ebazdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { Order, OrderStatus } from "../shared";
import { OrderDeliveredPublisher } from "../events/publisher/order-delivered-publisher";

const router = express.Router();

router.post(
  "/order/deliver",
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
        status: OrderStatus.Confirmed,
      });
      await Order.updateOne(
        { _id: req.body.id },
        {
          status: OrderStatus.Delivered
        }
      );
      if (order) {
        await new OrderDeliveredPublisher(natsWrapper.client).publish(order);
      }
      await session.commitTransaction();
      res.status(StatusCodes.OK).send(order);
    } catch (error: any) {
      await session.abortTransaction();

      console.error("order deliver operation failed", error);
      throw new BadRequestError("order deliver operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as orderDeliverRouter };