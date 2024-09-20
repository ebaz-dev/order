import request from "supertest";
import { app } from "../../app";

it("fails when a ID that does not exist is supplied", async () => {
  await request(app).get(`${global.apiPrefix}/get`).send({}).expect(400);
});
