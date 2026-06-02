import { CommonUtil } from "../utils/common.utils";
import { DbClient } from "./dbClient.module";

export class V1Model {
  private dbClient: DbClient;
  private commonUtil: CommonUtil;
  constructor() {
    this.dbClient = new DbClient("v1"); // TODO: DB Name
    this.commonUtil = new CommonUtil();
  }

  async get() {
    return {
      status: 200,
      data: "Hello World",
    };
  }
  async create(data: any) {
    return this.dbClient.insertOne(data);
  }
  async updateOne(filter: any, update: any) {
    return this.dbClient.updateOne(filter, update);
  }
  async deleteOne(data: any) {
    return this.dbClient.deleteOne(data);
  }
  async findOne(filter: any) {
    return this.dbClient.findOne(filter);
  }
  async find(filter: any) {
    return this.dbClient.find(filter);
  }
}
