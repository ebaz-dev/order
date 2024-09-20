import { Types } from "mongoose";
import { CartEventSubjects } from "./cart-event-subjects";

export interface CartProductRemovedEvent {
  subject: CartEventSubjects.CartProductRemoved;
  data: {
    id: Types.ObjectId;
    productId: Types.ObjectId;
    updatedAt: Date;
  };
}
