export class Configuration {
  mongoDB: string
  dbName: string

  constructor() {
    this.mongoDB = process.env.MONGO_DB ?? '' ;
    this.dbName = process.env.DB_NAME ?? '';
  }
}
