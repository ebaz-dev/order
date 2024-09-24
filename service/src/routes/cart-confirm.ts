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
import { Cart, CartStatus } from "../shared";
import { CartConfirmedPublisher } from "../events/publisher/cart-confirmed-publisher";

const router = express.Router();

router.post(
  "/cart/confirm",
  [body("id").notEmpty().isString().withMessage("Cart ID is required")],
  [body("deliveryDate").notEmpty().isString().withMessage("Delivery date is required")],
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cart = await Cart.findOne({
        _id: req.body.id,
        status: CartStatus.Created,
      });
      await Cart.updateOne(
        { _id: req.body.id },
        {
          deliveryDate: req.body.deliveryDate,
          status: CartStatus.Pending,
        }
      );
      if (cart) {
        await new CartConfirmedPublisher(natsWrapper.client).publish(cart);
      }
      await session.commitTransaction();
      res.status(StatusCodes.OK).send(cart);
    } catch (error: any) {
      await session.abortTransaction();

      console.error("Cart confirm operation failed", error);
      throw new BadRequestError("Cart confirm operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartConfirmRouter };
