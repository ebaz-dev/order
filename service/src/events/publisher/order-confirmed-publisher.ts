import { Publisher } from "@ebazdev/core";
import { OrderConfirmedEvent } from "../../shared/events/order-confirm-event";
import { OrderEventSubjects } from "../../shared/events/order-event-subjects";

export class OrderConfirmedPublisher extends Publisher<OrderConfirmedEvent> {
  subject: OrderEventSubjects.OrderConfirmed = OrderEventSubjects.OrderConfirmed;
}
