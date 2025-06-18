import { V1Model } from "../models/v1.model";

export class V1Service {
  private model: V1Model;

  constructor() {
    this.model = new V1Model();
  }

  async get() {
    return this.model.get();
  }
}
