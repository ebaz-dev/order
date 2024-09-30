import { Document, Schema, model } from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface CounterDoc extends Document {
    _id: string;
    seq: number
}

const counterSchema = new Schema<CounterDoc>(
    {
        _id: { type: String, required: true },
        seq: { type: Number, default: 0 }
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

counterSchema.set("versionKey", "version");
counterSchema.plugin(updateIfCurrentPlugin);

const Counter = model<CounterDoc>("Counter", counterSchema);

export { CounterDoc, Counter };
