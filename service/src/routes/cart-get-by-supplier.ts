import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, requireAuth, validateRequest } from "@ebazdev/core";
import { query } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { CartStatus } from "../shared";
import { prepareCart } from "./cart-get";
import { cartRepo } from "../repository/cart.repo";

const router = express.Router();

router.get(
  "/cart/get/supplier",
  [query("supplierId").notEmpty().isString().withMessage("Supplier ID is required")],
  [query("merchantId").notEmpty().isString().withMessage("Merchant ID is required")],
  currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const cart = await cartRepo.selectOne({ supplierId: req.query.supplierId, merchantId: req.query.merchantId, status: { $in: [CartStatus.Created, CartStatus.Pending, CartStatus.Returned] } });
      if (cart) {
        const data = await prepareCart(cart);
        res.status(StatusCodes.OK).send({ data });
      } else {
        res.status(StatusCodes.OK).send({ data: {} });
      }
    } catch (error) {
      res.status(StatusCodes.OK).send({ data: {} });
    }
  }
);

export { router as cartGetSupplierRouter, };
