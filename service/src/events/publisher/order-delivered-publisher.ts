import { Publisher } from "@ebazdev/core";
import { OrderDeliveredEvent } from "../../shared/events/order-deliver-event";
import { OrderEventSubjects } from "../../shared/events/order-event-subjects";

export class OrderDeliveredPublisher extends Publisher<OrderDeliveredEvent> {
  subject: OrderEventSubjects.OrderDelivered = OrderEventSubjects.OrderDelivered;
}
