import { Publisher } from "@ebazdev/core";
import { CartEventSubjects } from "../../shared/events/cart-event-subjects";
import { CartProductAddedEvent } from "../../shared/events/cart-product-add-event";

export class CartProductAddedPublisher extends Publisher<CartProductAddedEvent> {
  subject: CartEventSubjects.CartProductAdded =
    CartEventSubjects.CartProductAdded;
}
