import { Publisher } from "@ebazdev/core";
import { OrderEventSubjects } from "../../shared/events/order-event-subjects";
import { OrderPaymentMethodUpdatedEvent } from "../../shared/events/order-payment-method-update-event";

export class OrderPaymentMethodUpdatedPublisher extends Publisher<OrderPaymentMethodUpdatedEvent> {
  subject: OrderEventSubjects.OrderPaymentMethodUpdated = OrderEventSubjects.OrderPaymentMethodUpdated;
}
