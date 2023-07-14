export class RabbitMQService {
  async sendEvent<T>(event: string, payload: T) {
    console.log('Sending message');
    console.log(event);
    console.log(payload);
  }
}
