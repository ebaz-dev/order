import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export enum OrderStatus {
  Created = "created",
  Pending = "pending",
  Confirmed = "confirmed",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export enum PaymentMethods {
  Cash = "cash",
  QPay = "qpay",
  MBank = "mbank",
}

export enum OrderLogType {
  Status = "status",
  Payment = "payment",
  Supplier = "supplier"
}

export enum OrderActions {
  Create = "create",
  Update = "update",
  Confirm = "confirm",
  Deliver = "deliver",
  Cancel = "cancel"
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
  thirdPartyData: { customerId: Types.ObjectId, productId: number }[],
  promoId: number;
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
    thirdPartyData: [{
      customerId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: "Customer",
      }, productId: {
        type: Number,
        required: false,
      },
    }],
    promoId: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

interface OrderLogDoc extends Document {
  userId?: Types.ObjectId;
  type: OrderLogType;
  action: OrderActions;
  fields: { key: string, oldValue: string, newValue: string }[];
  description?: string;
}

const orderLogSchema = new Schema<OrderLogDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "User",
    },
    type: { type: String, enum: Object.values(OrderLogType), required: true },
    action: { type: String, enum: Object.values(OrderActions), required: true },
    fields: [{
      key: String,
      oldValue: String,
      newValue: String
    }],

    description: {
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

interface OrderDoc extends Document {
  orderNo?: string;
  status: OrderStatus;
  supplierId: Types.ObjectId;
  merchantId: Types.ObjectId;
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  products: OrderProductDoc[];
  giftProducts: OrderProductDoc[];
  orderedAt: Date;
  deliveryDate: Date;
  paymentMethod: PaymentMethods;
  thirdPartyId: string;
  merchantDebt: number;
  logs: OrderLogDoc[];
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
    giftProducts: [orderProductSchema],
    orderedAt: Date,
    deliveryDate: Date,
    paymentMethod: {
      type: String, enum: Object.values(PaymentMethods),
      required: false,
    },
    thirdPartyId: { type: String, required: false },
    merchantDebt: {
      type: Number,
      required: false,
    },
    logs: [orderLogSchema],
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

export { OrderDoc, Order, OrderProductDoc, OrderLogDoc };
