import { Publisher } from "@ebazdev/core";
import { CartEventSubjects } from "../../shared/events/cart-event-subjects";
import { CartProductRemovedEvent } from "../../shared/events/cart-product-remove-event";

export class CartProductRemovedPublisher extends Publisher<CartProductRemovedEvent> {
  subject: CartEventSubjects.CartProductRemoved =
    CartEventSubjects.CartProductRemoved;
}
