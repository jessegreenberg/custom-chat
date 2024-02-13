import { createObservableArray, ObservableArray } from 'phet-lib/axon';
import Message from './Message.ts';

export default class ChatModel {
  public readonly messages: ObservableArray<Message>;

  public constructor() {
    this.messages = createObservableArray();
  }

  step( dt: number ): void {
    // update the model based on the passage of time
  }

  /**
   * Add a message to the chat.
   */
  public addMessage( message: Message ): void {
    this.messages.push( message );
  }

  /**
   * Remove a message from the chat.
   */
  public removeMessage( message: Message ): void {
    this.messages.remove( message );
  }

  /**
   * Remove all messages from the chat.
   */
  public clearMessages(): void {
    this.messages.clear();
  }

  /**
   * Sends a new message. The message is added to the list of messages, and a request is made to OpenAI.
   */
  public sendMessage( message: string ): void {
    const newMessage = new Message( message, 'user', new Date().getTime() );
    this.addMessage( newMessage );

    // Make a request to OpenAI
    // ...
  }
}