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
import { CartStatus } from "../shared";
import { CartConfirmedPublisher } from "../events/publisher/cart-confirmed-publisher";
import { prepareCart } from "./cart-get";
import { cartRepo } from "../repository/cart.repo";
import { migrateProducts } from "../utils/migrateProducts";

const router = express.Router();

router.post(
  "/cart/confirm",
  [body("supplierId").notEmpty().isString().withMessage("Supplier ID is required")],
  [body("merchantId").notEmpty().isString().withMessage("Merchant ID is required")],
  [body("deliveryDate").notEmpty().isString().withMessage("Delivery date is required")],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const cart = await cartRepo.selectOne({
        supplierId: req.body.supplierId,
        merchantId: req.body.merchantId,
        status: { $in: [CartStatus.Created, CartStatus.Returned] }
      });

      if (!cart) {
        throw new NotFoundError()
      }

      cart.deliveryDate = req.body.deliveryDate
      cart.status = CartStatus.Pending

      await cart.save();

      await new CartConfirmedPublisher(natsWrapper.client).publish(cart);
      await session.commitTransaction();

      const preparedCart = await migrateProducts(cart);

      res.status(StatusCodes.OK).send({ data: preparedCart });
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
