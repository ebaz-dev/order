import {
  IReturnFindWithAdjustedPrice,
  Product,
  ProductDoc,
} from "@ebazdev/product";
import { CartDoc, CartProductDoc } from "../shared";
import { Types } from "mongoose";
import { Customer, HoldingSupplierCodes, Merchant, Supplier } from "@ebazdev/customer";

export const migrateProducts = async (cart: CartDoc): Promise<any> => {
  const idsArray: string[] = cart.products.map((item) => item.id.toString());

  const query = {
    _id: { $in: idsArray },
    customerId: cart.supplierId.toString(),
  };
  const skip = 0;
  const limit = 100;
  const sort: { [key: string]: 1 | -1 } = { priority: 1 };
  let promos: any = []

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
      if (foundProduct.promos) {
        promos = promos.concat(foundProduct.promos);
      }
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
        thirdPartyData: foundProduct.thirdPartyData
      };
    }
  });

  const merchant = await Merchant.findById(cart.merchantId);
  const tradeshop = merchant?.tradeShops?.find(ts => ts.holdingKey === HoldingSupplierCodes.CocaCola);
  const supplier = await Supplier.findById(cart.supplierId);

  // Processing promo products
  let giftProducts: any = [];
  promos = [...new Map(promos.map((promo: any) =>
    [promo.thirdPartyData.thirdPartyPromoId, promo])).values()];
  if (tradeshop) {
    promos.map((promo: any) => {
      if (promo.tradeshops.indexOf(tradeshop.tsId) !== -1) {
        let includedQuantity = 0;
        products.map((product: any) => {
          if (promo.products.indexOf(product.id) !== -1) {
            includedQuantity += product.quantity;
          }
        });
        if (promo.thresholdQuantity <= includedQuantity) {
          giftProducts.push({ id: promo.giftProducts[0], quantity: promo.giftQuantity * Math.floor(Number(includedQuantity) / Number(promo.thresholdQuantity)), promoId: promo.thirdPartyData.thirdPartyPromoId })
        }
      }

    })
  }

  const giftIdsArray: string[] = giftProducts.map((item: any) => item.id.toString());

  const giftQuery = {
    _id: { $in: giftIdsArray },
    customerId: cart.supplierId.toString(),
  };

  const giftResult: IReturnFindWithAdjustedPrice =
    await Product.findWithAdjustedPrice({
      query: giftQuery,
      skip,
      limit,
      sort,
      merchant: {
        merchantId: cart.merchantId,
        businessTypeId: new Types.ObjectId(),
      },
    });

  giftProducts = giftProducts.map((item: any) => {
    const foundProduct = giftResult.products.find(
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
        quantity: 0,
        basePrice: price,
        price: 0,
        giftQuantity: item.quantity,
        totalPrice: item.quantity * price,
        stock: foundProduct.inventory?.availableStock,
        inCase: foundProduct.inCase,
        promoId: item.promoId
      };
    }
  });

  return {
    id: cart.id,
    status: cart.status,
    userId: cart.userId,
    products,
    giftProducts,
    merchant: { id: merchant?.id, name: merchant?.name },
    supplier: { id: supplier?.id, name: supplier?.name },
  };
};
