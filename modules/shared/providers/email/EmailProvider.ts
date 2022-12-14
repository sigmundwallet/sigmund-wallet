export class EmailProvider {
  constructor(
    public options: {
      appName: string;
      fromEmail: string;
    }
  ) {}

  async sendEmail(email: string, subject: string, body: string) {}
}
