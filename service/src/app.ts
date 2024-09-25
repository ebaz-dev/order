import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import cookieSession from "cookie-session";
import * as dotenv from "dotenv";
import { cartGetRouter } from "./routes/cart-get";
import { cartListRouter } from "./routes/cart-list";
import { cartProductAddRouter } from "./routes/cart-product-add";
import { cartConfirmRouter } from "./routes/cart-confirm";
import { cartProductRemoveRouter } from "./routes/cart-product-remove";
import { orderCreateRouter } from "./routes/order-create";
import { orderGetRouter } from "./routes/order-get";
import { orderListRouter } from "./routes/order-list";
import { cartGetSupplierRouter } from "./routes/cart-get-by-supplier";
dotenv.config();

const apiPrefix = "/api/v1/order";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: true,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY!],
  })
);

app.use(apiPrefix, cartConfirmRouter);
app.use(apiPrefix, cartGetRouter);
app.use(apiPrefix, cartGetSupplierRouter);
app.use(apiPrefix, cartListRouter);
app.use(apiPrefix, cartProductAddRouter);
app.use(apiPrefix, cartProductRemoveRouter);
app.use(apiPrefix, orderCreateRouter);
app.use(apiPrefix, orderGetRouter);
app.use(apiPrefix, orderListRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
