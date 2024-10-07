import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
  OrderInventoryEventSubjects, CartInventoryCheckedEvent
} from "@ebazdev/inventory";
import { queueGroupName } from "./queue-group-name";
import { Cart, CartStatus, Order, OrderDoc, OrderProductDoc, OrderStatus } from "../../shared";
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from "../publisher/order-created-publisher";
import { Product } from "@ebazdev/product";
import _ from "lodash";
import { migrateProducts } from "../../utils/migrateProducts";
import { getOrderNumber } from "../../utils/order-number";
import { ColaOrderStatusRecievedEvent, ColaOrderStatusSubjects } from "@ebazdev/cola-integration";

export class ColaOrderStatusReceivedListener extends Listener<ColaOrderStatusRecievedEvent> {
  readonly subject = ColaOrderStatusSubjects.OrderStatusRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaOrderStatusRecievedEvent["data"], msg: Message) {
    try {
      const { orderId, status } = data;

      const order = await Order.findOneAndUpdate({ orderNo: orderId }, { status });

      if (!order) {
        throw new Error("order not found");
      }
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderstatusRecieved:", error);
    }
  }
}
