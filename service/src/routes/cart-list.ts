import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Cart, CartStatus } from "../shared";
import { query } from "express-validator";
import _ from "lodash";
import { prepareCart } from "./cart-get";

const router = express.Router();

router.get(
  "/cart/list",
  [
    query("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {
      products: { $exists: true, $ne: [] },
      merchantId: req.query.merchantId,
      userId: req.currentUser?.id,
      status: { $in: [CartStatus.Created, CartStatus.Returned] }
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    const carts = await Cart.find(criteria);

    const promises = _.map(carts, async (cart) => {
      return prepareCart(cart);
    });
    const data = await Promise.all(promises);

    res.status(StatusCodes.OK).send({ data, total: data.length });
  }
);

export { router as cartListRouter };
