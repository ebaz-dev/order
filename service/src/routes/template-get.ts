import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { OrderTemplateDoc } from "../shared";
import { Product } from "@ebazdev/product";
import { Customer } from "@ebazdev/customer";
import { Inventory } from "@ebazdev/inventory";
import { Promo } from "@ebazdev/product/build/models/promo";
import { orderTemplateRepo } from "../repository/order-template.repo";
import { Types } from "mongoose";

const router = express.Router();

router.get(
  "/template/get",
  [query("id").notEmpty().isString().withMessage("ID is required")],
  [query("merchantId").notEmpty().isString().withMessage("Merchant ID is required")],
  currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const orderTemplate = await orderTemplateRepo.selectOne({ _id: req.query.id });
    if (orderTemplate) {
      const data = await prepareTemplate(orderTemplate, req.body.merchantId);
      res.status(StatusCodes.OK).send({ data });
    } else {
      throw new Error("Select: not found");
    }
  }
);

const prepareTemplate = async (
  template: OrderTemplateDoc, merchantId: Types.ObjectId
): Promise<any> => {
  const promises = _.map(template.products, async (product, i) => {
    await Inventory.find({ totalStock: 100 });
    await Promo.findOne({});
    try {

      const productPrice = await Product.findOneWithAdjustedPrice({
        query: { _id: new Types.ObjectId(product.id) },
        merchant: { merchantId: merchantId, businessTypeId: merchantId },
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
        basePrice: price,
        price,
        giftQuantity: 0,
        totalPrice: product.quantity * price,
        stock: productPrice.inventory?.availableStock,
        inCase: productPrice.inCase
      };
    } catch (error) {
      return product
    }
  });
  const products = await Promise.all(promises);
  const merchant = await Customer.findById(merchantId);
  const supplier = await Customer.findById(template.supplierId);
  return { id: template.id, products, type: template.type, merchant: { id: merchant?.id, name: merchant?.name }, supplier: { id: supplier?.id, name: supplier?.name }, name: template.name, image: template.image, color: template.color }
};
export { router as templateGetRouter, prepareTemplate };
