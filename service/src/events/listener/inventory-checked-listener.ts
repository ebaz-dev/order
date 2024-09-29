import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  OrderInventoryEventSubjects, CartInventoryCheckedEvent
} from "@ebazdev/inventory";
import { queueGroupName } from "./queue-group-name";
import { CartStatus, OrderDoc, OrderProductDoc, OrderStatus } from "../../shared";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from "../publisher/order-created-publisher";
import { Product } from "@ebazdev/product";
import _ from "lodash";
import { cartRepo } from "../../repository/cart.repo";
import { orderRepo } from "../../repository/order.repo";

export class CartInventoryCheckedListener extends Listener<CartInventoryCheckedEvent> {
  readonly subject = OrderInventoryEventSubjects.CartInventoryChecked;
  queueGroupName = queueGroupName;

  async onMessage(data: CartInventoryCheckedEvent["data"], msg: Message) {
    try {
      const { cartId, status, insufficientProducts } = data;

      const cart = await cartRepo.findById(cartId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      if (status === "confirmed") {
        const promises = _.map(cart.products, async (product, i) => {
          // await Inventory.find({ totalStock: 100 });
          const productPrice = await Product.findOneWithAdjustedPrice({
            query: { _id: product.id },
            merchant: { merchantId: cart.merchantId, businessTypeId: cart.merchantId },
          });

          const price = productPrice._adjustedPrice
            ? productPrice._adjustedPrice.price + productPrice._adjustedPrice.cost
            : 0;

          return <OrderProductDoc>{
            id: product.id,
            name: productPrice.name,
            images: productPrice.images,
            description: productPrice.description,
            quantity: product.quantity,
            basePrice: price,
            price,
            giftQuantity: 0,
            inCase: productPrice.inCase
          };
        });
        const products = await Promise.all(promises);
        const order = await orderRepo.create(<OrderDoc>{
          status: OrderStatus.Created,
          supplierId: cart.supplierId,
          merchantId: cart.merchantId,
          userId: cart.userId,
          cartId: cart.id,
          orderedAt: new Date(),
          deliveryDate: cart.deliveryDate,
          products: products
        })
        cart.set({ status: CartStatus.Ordered, orderedAt: new Date() });
        await cart.save();
        await new OrderCreatedPublisher(natsWrapper.client).publish(order);
      } else if (status === "cancelled") {
        cart.set({
          status: CartStatus.Returned, returnedProducts: insufficientProducts
        })
        await cart.save();
      }
      msg.ack();
    } catch (error) {
      console.error("Error processing InventoryCreatedEvent:", error);
    }
  }
}
