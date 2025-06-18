
export class Logger {
  private priority: string
  constructor(members: {priority: string}) {
    this.priority = members.priority!;
  }
  log(flag: boolean, data: any, event: string = '') {
    if(this.priority == 'high' && flag) {
      console.log(`:= ${Date.now()} =:= ${event} =:= ${JSON.stringify(data)} =:`);
    }
  }
  error(error: any, event: string = '') {
    console.error(`:= ${Date.now()} =:= ${event} =:= ${JSON.stringify(error)} =:`);
  }
}
