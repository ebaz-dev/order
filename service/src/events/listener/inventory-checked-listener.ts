import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  InventoryCreatedEvent,
  InventoryEventSubjects,
} from "@ebazdev/inventory";
import { queueGroupName } from "./queue-group-name";
import { Cart, CartStatus, Order, OrderStatus } from "../../shared";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from "../publisher/order-created-publisher";

export class InventoryCreatedListener extends Listener<InventoryCreatedEvent> {
  readonly subject = InventoryEventSubjects.InventoryCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: InventoryCreatedEvent["data"], msg: Message) {
    try {
      const { id } = data;

      const cart = await Cart.findById(id);

      if (!cart) {
        throw new Error("Cart not found");
      }

      const order = await Order.create({
        status: OrderStatus.Created,
        supplierId: cart.supplierId,
        merchantId: cart.merchantId,
        userId: cart.userId,
        cartId: cart.id,
        orderedAt: new Date(),
        products: cart.products
      })

      cart.set({ status: CartStatus.Ordered });
      await cart.save();


      await new OrderCreatedPublisher(natsWrapper.client).publish(order);

      msg.ack();
    } catch (error) {
      console.error("Error processing InventoryCreatedEvent:", error);
    }
  }
}
