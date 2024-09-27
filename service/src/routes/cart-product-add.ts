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
import { Cart, CartProductDoc, CartStatus } from "../shared";
import { CartProductAddedPublisher } from "../events/publisher/cart-product-added-publisher";
import _ from "lodash";
import { prepareCart } from "./cart-get";

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

    try {
      let cart = await Cart.findOne({
        supplierId: data.supplierId,
        merchantId: data.merchantId,
        userId: req.currentUser?.id,
        status: { $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned] }
      });
      let quantity = data.quantity;
      if (cart) {
        if (cart.status === CartStatus.Pending) {
          throw new Error("Processing cart to order!");
        }
        let index = -1;
        cart.products.forEach((product, i) => {
          if (product.id.toString() === data.productId) {
            index = i;
            quantity += product.quantity;
          }
        });
        if (index > -1) {
          if (quantity > 0) {
            cart.products[index].quantity = quantity;
          } else {
            cart.products.splice(index, 1)
          }
        } else if (index < 0 && quantity > 0) {
          cart.products.push(<CartProductDoc>{
            id: data.productId,
            quantity: data.quantity
          })
        }
        await cart.save()
      } else {
        cart = await Cart.create({
          status: CartStatus.Created,
          supplierId: data.supplierId,
          merchantId: data.merchantId,
          userId: req.currentUser?.id,
          products: quantity > 0 ? [{ id: data.productId, quantity: data.quantity }] : [],
        });
      }

      await new CartProductAddedPublisher(natsWrapper.client).publish({
        id: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        updatedAt: new Date(),
      });
      cart = await prepareCart(cart);
      await session.commitTransaction();
      res.status(StatusCodes.OK).send({ data: cart });
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
