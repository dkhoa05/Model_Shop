import { PaymentConfig } from "../models/PaymentConfig.js";

/** COD luôn có; các phương thức còn lại chỉ bật khi shop đã cấu hình thông tin nhận tiền */
export async function getEnabledPaymentMethods() {
  const c = await PaymentConfig.findOne().lean();
  const methods = ["cod"];
  if (c?.bankAccount?.trim()) methods.push("bank_transfer");
  if (c?.momoPhone?.trim()) methods.push("momo");
  if (c?.zalopayPhone?.trim()) methods.push("zalopay");
  return methods;
}
