export default class Message {

  // the content of the message
  public readonly string: string;

  // when the message was sent
  public readonly timestamp: number;

  // who sent the message
  public readonly source: 'user' | 'bot';

  constructor( string: string, source: 'user' | 'bot', timestamp: number ) {
    this.string = string;
    this.source = source;
    this.timestamp = timestamp;
  }
}