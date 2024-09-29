import { BaseRepository } from "@ebazdev/core";
import { Order, OrderDoc } from "../shared";

class OrderRepository extends BaseRepository<OrderDoc> {
    constructor() {
        super();
        this.setModel(Order);
    }
}
const orderRepo = new OrderRepository();

export { orderRepo }