import { Document, Schema, Types, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

export declare enum CustomerType {
    Supplier = "supplier",
    Merchant = "merchant"
}

interface OrderTemplateProductDoc extends Document {
    id: Types.ObjectId;
    quantity: number;
}
const orderTemplateProductSchema = new Schema<OrderTemplateProductDoc>(
    {
        id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Product",
        },
        quantity: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

interface OrderTemplateDoc extends Document {
    type: CustomerType;
    supplierId: Types.ObjectId;
    merchantId?: Types.ObjectId;
    products: OrderTemplateProductDoc[];
}

const orderTemplateSchema = new Schema<OrderTemplateDoc>(
    {
        type: { type: String, enum: Object.values(CustomerType), required: true },
        supplierId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Customer",
        },
        merchantId: {
            type: Schema.Types.ObjectId,
            required: false,
            ref: "Customer",
        },
        products: [orderTemplateProductSchema],
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

orderTemplateSchema.set("versionKey", "version");
orderTemplateSchema.plugin(updateIfCurrentPlugin);

const OrderTemplate = model<OrderTemplateDoc>("OrderTemplate", orderTemplateSchema);

export { OrderTemplateDoc, OrderTemplate };
