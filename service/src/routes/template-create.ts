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
import { OrderTemplate, OrderTemplateDoc } from "../shared";

const router = express.Router();

router.post(
    "/template/create",
    [
        body("type")
            .notEmpty()
            .matches(/\b(?:supplier|merchant)\b/)
            .isString()
            .withMessage("Type is required"),
        body("supplierId").notEmpty().isString().withMessage("Supplier ID is required"),
        body("products").notEmpty().isArray().withMessage("Products are required"),
        body("name").notEmpty().isString().withMessage("Name is required"),
    ],
    currentUser,
    requireAuth,
    validateRequest,
    async (req: Request, res: Response) => {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const orderTemplate = await OrderTemplate.create(<OrderTemplateDoc>req.body);
            await session.commitTransaction();
            res.status(StatusCodes.CREATED).send(orderTemplate);
        } catch (error: any) {
            await session.abortTransaction();
            console.error("Order template create operation failed", error);
            throw new BadRequestError("Order template create operation failed");
        } finally {
            session.endSession();
        }
    }
);

export { router as templateCreateRouter };
