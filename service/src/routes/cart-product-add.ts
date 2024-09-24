import express, { Request, Response } from "express";
import {
  BadRequestError,
  currentUser,
  requireAuth,
  validateRequest,
} from "@ebazdev/core";
import { body } from "express-validator";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { Cart, CartStatus } from "../shared";
import { CartProductAddedPublisher } from "../events/publisher/cart-product-added-publisher";
import _ from "lodash";

const router = express.Router();

router.post(
  "/cart/product/add",
  [
    body("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
    body("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
    body("productId")
      .notEmpty()
      .isString()
      .withMessage("Product ID is required"),
    body("quantity").notEmpty().isNumeric().withMessage("Quantity is required"),
  ], currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const data = req.body;
    const exists = { cart: false, product: false, remove: false };
    let cart: any;
    try {
      try {
        cart = await Cart.findOne({
          supplierId: data.supplierId,
          merchantId: data.merchantId,
          userId: req.currentUser?.id,
          status: CartStatus.Created,
        });
        console.log("cart", cart);
        const product = _.first(
          _.filter(cart?.products, (p) => {
            return p.id.toString() === data.productId;
          })
        );
        exists.cart = !!cart;
        exists.product = !!product;
        const quantity = (product?.quantity || 0) + data.quantity;
        exists.remove = quantity <= 0 ? true : false;
      } catch (error) { }
      console.log("exists", exists);
      if (!!exists.cart) {
        await Cart.updateOne(
          {
            supplierId: data.supplierId,
            merchantId: data.merchantId,
            userId: req.currentUser?.id,
            status: CartStatus.Created,
          },
          !!exists.remove
            ? {
              $pull: {
                products: {
                  id: data.productId,
                },
              },
            }
            : !!exists.product
              ? {
                $inc: {
                  "products.$[p].quantity": data.quantity,
                },
              }
              : {
                $push: {
                  products: {
                    id: data.productId,
                    quantity: data.quantity,
                  },
                },
              },
          !!exists.product
            ? {
              arrayFilters: [{ "p.id": data.productId }],
              upsert: true,
            }
            : {}
        );
      } else {
        cart = await Cart.create({
          status: CartStatus.Created,
          supplierId: data.supplierId,
          merchantId: data.merchantId,
          userId: req.currentUser?.id,
          products: [{ id: data.productId, quantity: data.quantity }],
        });
      }

      await new CartProductAddedPublisher(natsWrapper.client).publish({
        id: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        updatedAt: new Date(),
      });
      await session.commitTransaction();
      res.status(StatusCodes.OK).send(cart.id);
    } catch (error: any) {
      await session.abortTransaction();
      console.error("Product add operation failed", error);
      throw new BadRequestError("product add operation failed");
    } finally {
      session.endSession();
    }
  }
);

export { router as cartProductAddRouter };
