import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Cart } from "../shared";
import { Product } from "@ebazdev/product";

const router = express.Router();

router.get(
  "/cart/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  validateRequest,
  async (req: Request, res: Response) => {
    const cart = await Cart.findById(req.query.id);
    if (cart) {
      const promises = _.map(cart.products, async (product, i) => {
        const productPrice = await Product.findOneWithAdjustedPrice({
          query: { _id: product.id },
          customer: { customerId: cart.merchantId },
        });

        const price = productPrice._adjustedPrice
          ? productPrice._adjustedPrice.price + productPrice._adjustedPrice.cost
          : 0;
        return {
          id: product.id,
          quantity: product.quantity,
          price,
          totalPrice: product.quantity * price,
        };
      });
      const products = await Promise.all(promises);

      res.status(StatusCodes.OK).send({
        id: cart.id,
        status: cart.status,
        supplierId: cart.supplierId,
        merchantId: cart.merchantId,
        products,
      });
    }
  }
);

export { router as cartGetRouter };
