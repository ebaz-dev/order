import * as _ from "lodash";
import express, { Request, Response } from "express";
import { currentUser, QueryOptions, requireAuth, validateRequest } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { orderTemplateRepo } from "../repository/order-template.repo";
const router = express.Router();

router.get(
  "/template/list",
  currentUser, requireAuth,
  validateRequest,
  async (req: Request, res: Response) => {


    const criteria: any = {
      merchantId: req.query.merchantId,
    };
    if (req.query.supplierId) {
      criteria.supplierId = req.query.supplierId;
    }
    const options: QueryOptions = <QueryOptions>req.query;
    options.sortBy = "updatedAt";
    options.sortDir = -1;
    const result = await orderTemplateRepo.selectAndCountAll(criteria, options);
    res.status(StatusCodes.OK).send(result);
  }
);

export { router as templateListRouter };
