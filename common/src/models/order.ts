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
  name: string;
  description?: string;
  images?: string[];
  price: number;
  basePrice?: number;
  quantity: number;
  giftQuantity?: number;
  inCase?: number;
}
const orderProductSchema = new Schema<OrderProductDoc>(
  {
    id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    name: {
      type: String,
      required: true,
    },
    images: [{
      type: String,
      required: false,
    },],
    price: {
      type: Number,
      required: true,
    },
    basePrice: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
    giftQuantity: {
      type: Number,
      required: false,
    },
    inCase: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

interface OrderDoc extends Document {
  orderNo?: string;
  status: OrderStatus;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  products: OrderProductDoc[];
  orderedAt: Date;
  deliveryDate: Date;
  paymentMethod: string;
}

const orderSchema = new Schema<OrderDoc>(
  {
    orderNo: { type: String, required: false },
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
    deliveryDate: Date,
    paymentMethod: {
      type: String,
      required: false,
    },
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

export { OrderDoc, Order, OrderProductDoc };
