import { Supplier } from "@ebazdev/customer";
import { Sequence } from "../shared/models/sequence";
import moment from "moment";

export const getOrderNumber = async (supplierId: string): Promise<any> => {
  let code = "EB";
  const duration = moment().format("YYMMDD");
  const supplier = await Supplier.findById(supplierId);
  if (supplier && supplier.code) {
    code = supplier.code;
  }

  let sequence = await Sequence.findOneAndUpdate(
    { code, duration },
    { $inc: { seq: 1 } }
  );

  if (!sequence) {
    sequence = await Sequence.create({ code, duration, seq: 1 });
  }
  return `${code}${duration}${sequence.seq}`;
};
