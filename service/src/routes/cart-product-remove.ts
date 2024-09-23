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
import { Cart } from "../shared";
import { CartProductRemovedPublisher } from "../events/publisher/cart-product-removed-publisher";

const router = express.Router();

router.post(
  "/cart/product/remove",
  [
    body("id").notEmpty().isString().withMessage("Cart ID is required"),
    body("productId")
      .notEmpty()
      .isString()
      .withMessage("Product ID is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Cart.updateOne(
        { _id: req.body.id, "products.id": req.body.productId },
        {
          $pull: {
            products: {
              id: req.body.productId,
            },
          },
        }
      );
      await new CartProductRemovedPublisher(natsWrapper.client).publish({
        id: req.body.id,
        productId: req.body.productId,
        updatedAt: new Date(),
      });
      await session.commitTransaction();
      res.status(StatusCodes.OK).send();
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Product remove operation failed", error);
      throw new BadRequestError("product remove operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartProductRemoveRouter };
