import request from "supertest";
import { app } from "../../app";

it("Success get list", async () => {
  await request(app).get(`${global.apiPrefix}/list`).send({}).expect(200);
});
