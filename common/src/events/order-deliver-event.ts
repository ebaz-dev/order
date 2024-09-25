import { OrderDoc } from "../models/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderDeliveredEvent {
  subject: OrderEventSubjects.OrderDelivered;
  data: OrderDoc;
}
