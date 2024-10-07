import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../shared";
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
      msg.ack();
    }
  }
}
