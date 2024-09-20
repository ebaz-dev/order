import { Schema } from "mongoose";
import { Customer, CustomerDoc } from "./customer";

interface SupplierDoc extends CustomerDoc {
  orderMin: number;
  deliveryDays: number[];
}

const Supplier = Customer.discriminator<SupplierDoc>(
  "supplier",
  new Schema(
    {
      orderMin: Number,
      deliveryDays: { type: [Number], enum: [1, 2, 3, 4, 5, 6, 7] },
    },
    { discriminatorKey: "type" }
  )
);

export { SupplierDoc, Supplier };
