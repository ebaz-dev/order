import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum OrderStatus {
  Created = "created",
  Pending = "pending",
  Confirmed = "confirmed",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

interface OrderProductDoc extends Document {
  id: Types.ObjectId;
  unitPrice: number;
  quantity: number;
}
const orderProductSchema = new Schema<OrderProductDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

interface OrderDoc extends Document {
  status: OrderStatus;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  products: OrderProductDoc[];
  orderedAt: Date;
  deliveryDate: Date;
}

const orderSchema = new Schema<OrderDoc>(
  {
    status: { type: String, enum: Object.values(OrderStatus), required: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    cartId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Cart",
    },
    products: [orderProductSchema],
    orderedAt: Date,
    deliveryDate: Date
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

const Order = model<OrderDoc>("Order", orderSchema);

export { OrderDoc, Order };
