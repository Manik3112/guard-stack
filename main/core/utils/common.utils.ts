import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export type Moment = moment.Moment;

export class CommonUtil {

  constructor() {}
  getuuidv4(): string {
    return uuidv4();
  }
  getCurrentDate(): Date {
    return new Date();
  }
  getDateObject(date: string | Date): Date {
    return moment(date).toDate();
  }
  jsonStringify(x: Record<string, any> | string): string {
    try {
      return JSON.stringify(x) as string;
    }
    catch(e) {
      console.error(e);
      return x as string;
    }
  }
}
