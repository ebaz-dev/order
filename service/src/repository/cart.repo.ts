import { BaseRepository } from "@ebazdev/core";
import { Cart, CartDoc } from "../shared";

class CartRepository extends BaseRepository<CartDoc> {
    constructor() {
        super();
        this.setModel(Cart);
    }
}
const cartRepo = new CartRepository();

export { cartRepo }