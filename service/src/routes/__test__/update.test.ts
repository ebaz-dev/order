import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

it("fails when a ID that does not exist is supplied", async () => {
  await request(app)
    .post(`${global.apiPrefix}/update`)
    .send({
      name: "Yuna",
      type: "supplier",
      regNo: "689563",
      address: "Ulaanbaatar, Mongolia",
      phone: "80995566",
    })
    .expect(400);
});

it("how to be call publish after an successful create customer", async () => {
  const response = await request(app)
    .post(`${global.apiPrefix}/create`)
    .send({
      id: "1",
      name: "New Supplier",
      type: "supplier",
      regNo: "690608",
      address: "Ulaanbaatar, Mongolia",
      phone: "80995566",
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
