import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { Cart, CartDoc } from "../shared";
import { Product } from "@ebazdev/product";
import { Customer } from "@ebazdev/customer";
import { Inventory } from "@ebazdev/inventory";

const router = express.Router();

router.get(
  "/cart/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const cart = await Cart.findOne({ _id: req.query.id });
    if (cart) {
      const data = await prepareCart(cart);
      res.status(StatusCodes.OK).send({ data });
    }
  }
);

const prepareCart = async (
  cart: CartDoc
): Promise<any> => {
  const promises = _.map(cart.products, async (product, i) => {
    await Inventory.find({ totalStock: 100 });
    const productPrice = await Product.findOneWithAdjustedPrice({
      query: { _id: product.id },
      merchant: { merchantId: cart.merchantId, businessTypeId: cart.merchantId },
    });

    const price = productPrice._adjustedPrice
      ? productPrice._adjustedPrice.price + productPrice._adjustedPrice.cost
      : 0;
    return {
      id: product.id,
      name: productPrice.name,
      images: productPrice.images,
      description: productPrice.description,
      quantity: product.quantity,
      price,
      totalPrice: product.quantity * price,
    };
  });
  const products = await Promise.all(promises);
  const merchant = await Customer.findById(cart.merchantId);
  const supplier = await Customer.findById(cart.supplierId);
  return { id: cart.id, status: cart.status, userId: cart.userId, products, merchant: { id: merchant?.id, name: merchant?.name }, supplier: { id: supplier?.id, name: supplier?.name } }
};
export { router as cartGetRouter, prepareCart };
