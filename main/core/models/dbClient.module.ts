import { Configuration } from "../utils/configuration.utils";
import { Logger } from "../utils/logger.utils";
import { createMemoryCollection } from "./memoryCollection.module";

import { MongoClient } from "mongodb";

export class DbClient {
  private logger: Logger;
  private configuration: Configuration;
  private client: any;
  private database: any;
  private db: any;

  constructor(collectionName: string) {
    this.configuration = new Configuration();
    this.logger = new Logger({priority: 'high'});
    this.initializeConnection(collectionName);
  }

  initializeConnection(collectionName: string) {
    if (!this.configuration.mongoDB || !this.configuration.dbName) {
      this.logger.log(
        true,
        collectionName,
        'MongoDB configuration not set; using in-memory store',
      );
      this.db = createMemoryCollection(collectionName);
      return;
    }
    this.client = new MongoClient(this.configuration.mongoDB);
    this.database = this.client.db(this.configuration.dbName);
    this.initializeDatabase(collectionName);
  }

  initializeDatabase(collectionName: string) {
    this.logger.log(true, collectionName, 'Databse Connection')
    this.db = this.database.collection(collectionName);
  }

  async insertOne(document: any) {
    return this.db.insertOne(document);
  }
  async insert(document: any) {
    return this.db.insert(document);
  }

  async findOne(filter: any) {
    return this.db.findOne(filter);
  }
  async find(filter: any) {
    return this.db.find(filter);
  }
  async updateOne(filter: any, update: any) {
    return this.db.updateOne(filter, update);
  }
  async update(filter: any, update: any) {
    return this.db.update(filter, update);
  }
  async deleteOne(filter: any) {
    return this.db.deleteOne(filter);
  }
  async delete(filter: any) {
    return this.db.delete(filter);
  }
}
