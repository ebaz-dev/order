import { OrderDoc } from "../models/order";
import { OrderEventSubjects } from "./order-event-subjects";

export interface OrderConfirmedEvent {
  subject: OrderEventSubjects.OrderConfirmed;
  data: OrderDoc;
}