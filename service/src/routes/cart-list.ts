import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { Cart, CartStatus } from "../shared";
import { query } from "express-validator";

const router = express.Router();

router.get(
  "/list",
  [
    query("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {
      products: { $exists: true, $ne: [] },
      merchantId: req.query.merchantId,
      status: CartStatus.Created,
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    if (req.query.merchantId) {
      criteria.merchantId = req.query.merchantId;
    }
    if (req.query.userId) {
      criteria.userId = req.query.userId;
    }
    const carts = await Cart.find(criteria);

    res.status(StatusCodes.OK).send(carts);
  }
);

export { router as cartListRouter };
