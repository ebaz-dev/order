import * as _ from "lodash";
import express, { Request, Response } from "express";
import {
  currentUser,
  listAndCount,
  QueryOptions,
  requireAuth,
  validateRequest,
} from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { prepareTemplate } from "./template-get";
import { Types } from "mongoose";
import { query } from "express-validator";
import { OrderTemplate, OrderTemplateDoc } from "../shared";
const router = express.Router();

router.get(
  "/template/list",
  [
    query("supplierId")
      .notEmpty()
      .isString()
      .withMessage("Supplier ID is required"),
  ],
  [
    query("merchantId")
      .notEmpty()
      .isString()
      .withMessage("Merchant ID is required"),
  ],
  currentUser,
  requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {
    const criteria: any = {
      $or: [
        { merchantId: req.query.merchantId },
        { merchantId: { $exists: false } },
      ],
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = await listAndCount(criteria, OrderTemplate, options);
    const promises = _.map(result.data, async (template) => {
      return prepareTemplate(
        <OrderTemplateDoc>template,
        new Types.ObjectId(req.query.merchantId as string)
      );
    });
    const data = await Promise.all(promises).then((items) =>
      items.filter((n) => n)
    );

    res.status(StatusCodes.OK).send({
      data,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  }
);

export { router as templateListRouter };
