import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import {
    InvoicePaidEvent, InvoiceEventSubjects
} from "@ebazdev/payment";
import { queueGroupName } from "./queue-group-name";
import { Order, OrderActions, OrderLogDoc, OrderLogType, OrderStatus } from "../../shared";
import { natsWrapper } from "../../nats-wrapper";
import _ from "lodash";
import { OrderConfirmedPublisher } from "../publisher/order-confirmed-publisher";

export class InvoicePaidListener extends Listener<InvoicePaidEvent> {
    readonly subject = InvoiceEventSubjects.InvoicePaid;
    queueGroupName = queueGroupName;

    async onMessage(data: InvoicePaidEvent["data"], msg: Message) {
        try {
            const order = await Order.findById(data.orderId);
            if (!order) {
                throw new Error("Order not found");
            }
            order.set({ status: OrderStatus.Confirmed });
            order.logs.push(<OrderLogDoc>{ type: OrderLogType.Payment, action: OrderActions.Confirm });
            await order.save();
            await new OrderConfirmedPublisher(natsWrapper.client).publish(order);
            msg.ack();
        } catch (error) {
            console.error("Error processing InvoicePaidEvent:", error);
            msg.ack();
        }
    }
}
