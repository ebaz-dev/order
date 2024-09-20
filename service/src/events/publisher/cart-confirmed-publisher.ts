import { Publisher } from "@ebazdev/core";
import { CartEventSubjects } from "../../shared/events/cart-event-subjects";
import { CartConfirmedEvent } from "../../shared/events/cart-confirm-event";

export class CartConfirmedPublisher extends Publisher<CartConfirmedEvent> {
  subject: CartEventSubjects.CartConfirmed = CartEventSubjects.CartConfirmed;
}
