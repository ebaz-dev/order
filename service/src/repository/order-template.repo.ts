import { BaseRepository } from "@ebazdev/core";
import { OrderTemplate, OrderTemplateDoc } from "../shared";

class OrderTemplateRepository extends BaseRepository<OrderTemplateDoc> {
    constructor() {
        super();
        this.setModel(OrderTemplate);
    }
}
const orderTemplateRepo = new OrderTemplateRepository();

export { orderTemplateRepo }