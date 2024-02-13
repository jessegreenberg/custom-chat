import { BooleanProperty, createObservableArray, DerivedProperty, ObservableArray, Property } from 'phet-lib/axon';
import Message from './Message.ts';
import Conversation from './Conversation.ts';

export default class ChatModel {
  public readonly messages: ObservableArray<Message>;

  public readonly isWaitingForTextProperty = new BooleanProperty( false );
  public readonly isWaitingForSpeechProperty = new BooleanProperty( false );

  // conversations - an array of messages arrays, where each array is a conversation
  // when the app loads, a new conversation is added
  // When a user presses 'new conversation', a new conversation is added and becomes active
  // When a user taps on a conversation in the history, that conversation becomes active

  // there is an activeConversation property - a reference to the current conversation
  // when the app loads, old conversations are loaded from local storage

  public readonly conversations: ObservableArray<Conversation>;

  public readonly activeConversationProperty = new Property<Conversation | null>( null );

  // @ts-ignore - TODO: Why are all of these required in the typing?
  public readonly isWaitingForResponseProperty: DerivedProperty<boolean>;

  public constructor() {
    this.messages = createObservableArray();
    this.conversations = createObservableArray();

    this.isWaitingForResponseProperty = new DerivedProperty( [ this.isWaitingForTextProperty, this.isWaitingForSpeechProperty ], ( isWaitingForText: boolean, isWaitingForSpeech: boolean ) => {
      return isWaitingForText || isWaitingForSpeech;
    } );

    // If the active conversation changes, update the messages
    this.activeConversationProperty.link( activeConversation => {
      if ( activeConversation ) {
        this.messages.clear();
        this.messages.addAll( activeConversation.messages );
      }
    } );

    // Upon loading, create a new conversation
    // TODO: Move to a load function?
    this.createNewConversation();
  }

  /**
   * Saves the current conversation to the list of conversations.
   */
  createNewConversation(): void {
    this.saveMessagesToConversation();

    const name = 'Conversation ' + ( this.conversations.length + 1 );
    const newConversation = new Conversation( name, createObservableArray() );
    this.conversations.push( newConversation );
    this.activeConversationProperty.value = newConversation;
  }

  /**
   * Saves the current messages to the active conversation. Needed before switching to a new conversation.
   */
  public saveMessagesToConversation(): void {
    if ( this.activeConversationProperty.value ) {
      this.activeConversationProperty.value.messages.clear();
      this.activeConversationProperty.value.messages.addAll( this.messages );
    }
  }

  /**
   * Activate a different conversation. Saves current messages to an active conversation before switching.
   */
  public activateConversation( conversation: Conversation ): void {
    this.saveMessagesToConversation();
    this.activeConversationProperty.value = conversation;
  }

  /**
   * To be overridden in subclasses.
   * @param dt
   */
  // @ts-ignore
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
  public async sendMessage( message: string ): Promise<void> {
    const newMessage = new Message( message, 'user', new Date().getTime() );
    this.addMessage( newMessage );

    // Send the message to the server
    const returnMessage = await this.sendDataToServer();
    this.addMessage( new Message( returnMessage, 'bot', new Date().getTime() ) );
  }

  /**
   * Send a request to the OpenAI server.
   */
  public async sendDataToServer(): Promise<string> {

    this.isWaitingForTextProperty.value = true;

    const data = {
      messages: this.messages
    };

    // Return an error message and indicate that the model is no longer waiting for this request.
    const resolveError = (): string => {
      this.isWaitingForTextProperty.value = false;
      return 'There was an error with the request.';
    }

    // Return a success message and indicate that the model is no longer waiting for this request.
    const resolveSuccess = ( message: string ): string => {
      this.isWaitingForTextProperty.value = false;
      return message;
    }

    try {
      const response = await fetch( 'http://localhost:3000/api/openai', {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data ) // convert the JavaScript object to a JSON string
      } );

      const responseData = await response.json(); // Parse the JSON response

      // if we get a 500 error, we should return an error message
      if ( response.status === 500 ) {
        return resolveError();
      }
      else {
        return resolveSuccess( responseData.message.content );
      }
    }
    catch( error ) {
      return resolveError();
    }
  }

  // @ts-ignore
  public async getSpeechFromServer( message: string ): Promise<IntentionalAny> {
    this.isWaitingForSpeechProperty.value = true;

    const data = {
      text: message
    };

    const resolveError = (): string => {
      this.isWaitingForSpeechProperty.value = false;
      return 'There was an error with the request.';
    }

    const resolveSuccess = ( message: string ): string => {
      this.isWaitingForSpeechProperty.value = false;
      return message;
    }

    try {
      const response = await fetch( 'http://localhost:3000/api/openai/speak', {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data ) // convert the JavaScript object to a JSON string
      } );

      const responseData = await response.json(); // Parse the JSON response

      // if we get a 500 error, we should return an error message
      if ( response.status === 500 ) {
        return resolveError();
      }
      else {
        return resolveSuccess( responseData );
      }
    }
    catch( error ) {
      return resolveError();
    }
  }
}