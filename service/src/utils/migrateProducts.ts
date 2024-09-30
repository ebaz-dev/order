import {
  IReturnFindWithAdjustedPrice,
  Product,
  ProductDoc,
} from "@ebazdev/product";
import { CartDoc, CartProductDoc } from "../shared";
import { Types } from "mongoose";
import { Customer } from "@ebazdev/customer";

export const migrateProducts = async (cart: CartDoc): Promise<any> => {
  const idsArray: string[] = cart.products.map((item) => item.id.toString());

  const query = {
    _id: { $in: idsArray },
    customerId: cart.supplierId.toString(),
  };
  const skip = 0;
  const limit = 100;
  const sort: { [key: string]: 1 | -1 } = { priority: 1 };

  const result: IReturnFindWithAdjustedPrice =
    await Product.findWithAdjustedPrice({
      query,
      skip,
      limit,
      sort,
      merchant: {
        merchantId: cart.merchantId,
        businessTypeId: new Types.ObjectId(),
      },
    });
  const products = cart.products.map((item) => {
    const foundProduct = result.products.find(
      (product: ProductDoc) => product.id.toString() === item.id.toString()
    );

    if (foundProduct) {
      const price =
        foundProduct.adjustedPrice!.price + foundProduct.adjustedPrice!.cost;

      return {
        id: foundProduct.id,
        name: foundProduct.name,
        images: foundProduct.images,
        description: foundProduct.description,
        quantity: item.quantity,
        basePrice: price,
        price,
        giftQuantity: 0,
        totalPrice: item.quantity * price,
        stock: foundProduct.inventory?.availableStock,
        inCase: foundProduct.inCase,
      };
    }
  });

  const merchant = await Customer.findById(cart.merchantId);
  const supplier = await Customer.findById(cart.supplierId);

  return {
    id: cart.id,
    status: cart.status,
    userId: cart.userId,
    products,
    merchant: { id: merchant?.id, name: merchant?.name },
    supplier: { id: supplier?.id, name: supplier?.name },
  };
};
