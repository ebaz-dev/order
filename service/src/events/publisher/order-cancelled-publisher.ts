import { Publisher } from "@ebazdev/core";
import { OrderCancelledEvent } from "../../shared/events/order-cancel-event";
import { OrderEventSubjects } from "../../shared/events/order-event-subjects";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: OrderEventSubjects.OrderCancelled = OrderEventSubjects.OrderCancelled;
}
