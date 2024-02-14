import Message from './Message.ts';

export default class Conversation {
  public readonly messages: Message[];
  public readonly name: string;

  public constructor( name: string, messages: Message[] ) {
    this.name = name;
    this.messages = messages;
  }
}