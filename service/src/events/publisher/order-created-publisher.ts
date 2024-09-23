import { Publisher } from "@ebazdev/core";
import { CartEventSubjects } from "../../shared/events/cart-event-subjects";
import { OrderCreatedEvent } from "../../shared/events/order-create-event";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: CartEventSubjects.OrderCreated = CartEventSubjects.OrderCreated;
}
