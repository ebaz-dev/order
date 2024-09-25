import { Publisher } from "@ebazdev/core";
import { OrderCreatedEvent } from "../../shared/events/order-create-event";
import { OrderEventSubjects } from "../../shared/events/order-event-subjects";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: OrderEventSubjects.OrderCreated = OrderEventSubjects.OrderCreated;
}
