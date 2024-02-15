import Message from './Message.ts';
import { Property } from 'phet-lib/axon';

export default class Conversation {
  public readonly messages: Message[];
  public readonly nameProperty: Property<string>;

  public constructor( name: string, messages: Message[] ) {
    this.nameProperty = new Property( name );
    this.messages = messages;
  }

  public save(): void {

    // Save this state to JSON
    return {
      name: this.nameProperty.value,
      messages: this.messages
    };
  }
}