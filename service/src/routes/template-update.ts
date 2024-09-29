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
import { orderTemplateRepo } from "../repository/order-template.repo";

const router = express.Router();

router.post(
    "/template/update",
    [
        body("id").notEmpty().isString().withMessage("Order Template ID is required"),
        body("supplierId").notEmpty().isString().withMessage("Supplier ID is required"),
        body("products").notEmpty().isArray().withMessage("Products are required"),
    ],
    currentUser,
    requireAuth,
    validateRequest,
    async (req: Request, res: Response) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await orderTemplateRepo.updateById({ id: req.body.id, data: req.body });
            await session.commitTransaction();
            res.status(StatusCodes.OK).send();
        } catch (error: any) {
            await session.abortTransaction();
            console.error("Order template update operation failed", error);
            throw new BadRequestError("Order template update operation failed");
        } finally {
            session.endSession();
        }
    }
);

export { router as templateUpdateRouter };
