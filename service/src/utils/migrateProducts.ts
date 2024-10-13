import {
  IReturnFindWithAdjustedPrice,
  Product,
  ProductDoc,
} from "@ebazdev/product";
import { CartDoc } from "../shared";
import { Types } from "mongoose";
import { HoldingSupplierCodes, Merchant, Supplier } from "@ebazdev/customer";

export const migrateProducts = async (cart: CartDoc): Promise<any> => {
  const idsArray: string[] = cart.products.map((item) => item.id.toString());

  const query = {
    _id: { $in: idsArray },
    customerId: cart.supplierId.toString(),
  };
  const skip = 0;
  const limit = 100;
  const sort: { [key: string]: 1 | -1 } = { priority: 1 };
  let promos: any = [];

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

  let products = cart.products.map((item) => {
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
        thirdPartyData: foundProduct.thirdPartyData,
      };
    }
  });

  const merchant = await Merchant.findById(cart.merchantId);
  const supplier = await Supplier.findById(cart.supplierId);
  const tradeshop = merchant?.tradeShops?.find(
    (ts) => ts.holdingKey === supplier?.holdingKey
  );

  // Processing promo products
  let giftProducts: any = [];
  let qualifiedPromos: any = [];
  promos = [
    ...new Map(
      promos.map((promo: any) => [
        promo.thirdPartyData.thirdPartyPromoId,
        promo,
      ])
    ).values(),
  ];
  if (tradeshop) {
    promos.map((promo: any) => {
      if (promo.thirdPartyData.thirdPartyPromoNo) {
        const isQualified = qualifiedPromos.filter(
          (qPromo: any) =>
            qPromo.thirdPartyData.thirdPartyPromoNo ===
            promo.thirdPartyData.thirdPartyPromoNo
        );
        if (isQualified) {
          return;
        }
      }
      if (promo.tradeshops.indexOf(Number(tradeshop.tsId)) !== -1) {
        if (promo.promoType === "x+y") {
          let includedQuantity = 0;
          products.map((product: any) => {
            if (promo.products.indexOf(product.id) !== -1) {
              includedQuantity += product.quantity;
            }
          });
          if (promo.thresholdQuantity <= includedQuantity) {
            qualifiedPromos.push(promo);
            giftProducts.push({
              id: promo.giftProducts[0],
              quantity:
                promo.giftQuantity *
                Math.floor(
                  Number(includedQuantity) / Number(promo.thresholdQuantity)
                ),
              promoId: promo.thirdPartyData.thirdPartyPromoId,
            });
          }
        } else if (promo.promoType === "z>x%") {
          let includedQuantity = 0;
          products.map((product: any) => {
            if (promo.products.indexOf(product.id) !== -1) {
              includedQuantity += product.quantity;
            }
          });
          if (promo.thresholdQuantity <= includedQuantity) {
            qualifiedPromos.push(promo);
            products.map((product: any) => {
              if (promo.products.indexOf(product.id.toString()) !== -1) {
                const discount = (product.basePrice / 100) * promo.promoPercent;
                product.price = product.basePrice - discount;
                product.promoId = promo.thirdPartyData.thirdPartyPromoId;
                product.promoPercent = promo.promoPercent;
                product.promoProducts = promo.products;
              }
              return product;
            });
          }
        }
      }
    });
  }

  const giftIdsArray: string[] = giftProducts.map((item: any) =>
    item.id.toString()
  );

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
        promoId: item.promoId,
        thirdPartyData: foundProduct.thirdPartyData,
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
    merchantDebt: 0,
    qualifiedPromos,
  };
};