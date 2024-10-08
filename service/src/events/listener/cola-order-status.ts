import { Message } from "node-nats-streaming";
import { Listener, NotFoundError } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";
import { Order, OrderActions, OrderLogDoc, OrderLogType, OrderStatus } from "../../shared";
import { ColaOrderStatusRecievedEvent, ColaOrderStatusSubjects } from "@ebazdev/cola-integration";
import { colaOrderStatuses } from "@ebazdev/cola-integration/build/models/cola-order-statuses";

export class ColaOrderStatusReceivedListener extends Listener<ColaOrderStatusRecievedEvent> {
  readonly subject = ColaOrderStatusSubjects.OrderStatusRecieved;
  queueGroupName = queueGroupName;

  async onMessage(data: ColaOrderStatusRecievedEvent["data"], msg: Message) {
    try {
      const { orderId, status } = data;

      const order = await Order.findOne({ orderNo: orderId });
      if (!order) {
        throw new Error("order not found");
      }
      if (status === colaOrderStatuses.confirmed) {
        order.status = OrderStatus.Confirmed;
        order.logs.push(<OrderLogDoc>{ type: OrderLogType.Supplier, action: OrderActions.Confirm });
      } else if (status === colaOrderStatuses.cancelled) {
        order.status = OrderStatus.Cancelled;
        order.logs.push(<OrderLogDoc>{ type: OrderLogType.Supplier, action: OrderActions.Cancel });
      } if (status === colaOrderStatuses.delivered) {
        order.status = OrderStatus.Delivered;
        order.logs.push(<OrderLogDoc>{ type: OrderLogType.Supplier, action: OrderActions.Deliver });
      }
      await order.save();
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderstatusRecieved:", error);
      msg.ack();
    }
  }
}
