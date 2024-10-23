import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  OrderInventoryEventSubjects,
  CartInventoryCheckedEvent,
} from "@ebazdev/inventory";
import { queueGroupName } from "./queue-group-name";
import {
  Cart,
  CartStatus,
  Order,
  OrderActions,
  OrderDoc,
  OrderLogDoc,
  OrderLogType,
  OrderProductDoc,
  OrderStatus,
  PaymentMethods,
} from "../../shared";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from "../publisher/order-created-publisher";
import { Product } from "@ebazdev/product";
import _ from "lodash";
import { migrateProducts } from "../../utils/migrateProducts";
import { getOrderNumber } from "../../utils/order-number";
import { Types } from "mongoose";

export class CartInventoryCheckedListener extends Listener<CartInventoryCheckedEvent> {
  readonly subject = OrderInventoryEventSubjects.CartInventoryChecked;
  queueGroupName = queueGroupName;

  async onMessage(data: CartInventoryCheckedEvent["data"], msg: Message) {
    try {
      const { cartId, status, insufficientProducts } = data;

      const cart = await Cart.findById(cartId);

      if (!cart) {
        throw new Error("Cart not found");
      }

      if (status === "confirmed") {
        const data = await migrateProducts(cart);
        const orderNo = await getOrderNumber(cart.supplierId.toString());

        const order = await Order.create(<OrderDoc>{
          status: OrderStatus.Created,
          supplierId: cart.supplierId,
          merchantId: cart.merchantId,
          userId: cart.userId,
          cartId: cart.id,
          orderedAt: new Date(),
          deliveryDate: cart.deliveryDate,
          products: data.products,
          giftProducts: data.giftProducts,
          orderNo,
          merchantDebt: data.merchantDebt,
          paymentMethod: PaymentMethods.Cash,
        });
        order.logs.push(<OrderLogDoc>{
          userId: cart.userId,
          type: OrderLogType.Status,
          action: OrderActions.Create,
        });
        await order.save();
        cart.set({ status: CartStatus.Ordered, orderedAt: new Date() });
        await cart.save();
        await new OrderCreatedPublisher(natsWrapper.client).publish(order);
      } else if (status === "cancelled") {
        cart.set({
          status: CartStatus.Returned,
          returnedProducts: insufficientProducts,
        });
        await cart.save();
      }
      msg.ack();
    } catch (error) {
      console.error("Error processing InventoryCreatedEvent:", error);
    }
  }
}
