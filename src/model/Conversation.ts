import Message from './Message.ts';
import { ObservableArray } from 'phet-lib/axon';

export default class Conversation {
  public readonly messages: ObservableArray<Message>;
  public readonly name: string;

  public constructor( name: string, messages: ObservableArray<Message> ) {
    this.name = name;
    this.messages = messages;
  }
}