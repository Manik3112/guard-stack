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
}
