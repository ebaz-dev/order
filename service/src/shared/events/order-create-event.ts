import { OrderDoc } from "../models/order";
import { CartEventSubjects } from "./cart-event-subjects";

export interface OrderCreatedEvent {
  subject: CartEventSubjects.OrderCreated;
  data: OrderDoc;
}
