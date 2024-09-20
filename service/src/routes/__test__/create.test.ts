import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

it("fails when a name that does not exist is supplied", async () => {
  await request(app)
    .post(`${global.apiPrefix}/create`)
    .send({
      type: "supplier",
      regNo: "690608",
      address: "Ulaanbaatar, Mongolia",
      phone: "80995566",
    })
    .expect(400);
});

it("how to be call publish after an successful create customer", async () => {
  const response = await request(app)
    .post(`${global.apiPrefix}/create`)
    .send({
      name: "New Supplier",
      type: "supplier",
      regNo: "690608",
      address: "Ulaanbaatar, Mongolia",
      phone: "80995566",
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
