import { BooleanProperty, createObservableArray, DerivedProperty, ObservableArray, Property } from 'phet-lib/axon';
import Message from './Message.ts';
import Conversation from './Conversation.ts';

export default class ChatModel {

  // The displayed list of messages for the active conversation
  public readonly messages: ObservableArray<Message>;

  // The conversation that is currently being displayed, and whose messages are used to send to the server
  public readonly activeConversationProperty = new Property<Conversation | null>( null );

  // Indicates if the model is waiting for a response from the server for text
  public readonly isWaitingForTextProperty = new BooleanProperty( false );

  // Indicates if the model is waiting for a response from the server for speech
  public readonly isWaitingForSpeechProperty = new BooleanProperty( false );

  // The list of conversations that have been created
  public readonly conversations: ObservableArray<Conversation>;

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
      this.messages.clear();

      if ( activeConversation ) {
        this.messages.addAll( activeConversation.messages );
      }
    } );
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

  deleteActiveConversation(): void {
    if ( this.activeConversationProperty.value ) {
      this.conversations.remove( this.activeConversationProperty.value );
      this.activateConversation( this.conversations[ this.conversations.length - 1 ] || null );

      this.save();
    }
  }

  /**
   * Saves the current messages to the active conversation. Needed before switching to a new conversation.
   */
  public saveMessagesToConversation(): void {
    if ( this.activeConversationProperty.value ) {

      // NOTE: Do not let Conversations use the same array is the messages array. This will cause the messages to
      // be deleted when we clear the conversation here.
      this.activeConversationProperty.value.messages.length = 0;

      this.messages.forEach( message => {
        this.activeConversationProperty.value!.messages.push( message );
      } );
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
    if ( !this.activeConversationProperty.value ) {
      this.createNewConversation();
    }

    this.messages.push( message );

    // Whenever a new message is added, save the state so it will be remembered.
    this.save();
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

  public load() {

    const jsonString = localStorage.getItem( 'customChat' );
    if ( jsonString ) {
      const modelData = JSON.parse( jsonString );

      // load the conversations
      this.conversations.clear();
      modelData.conversations.forEach( ( conversationData: { name: string, messages: Message[] } ) => {
        const conversation = new Conversation( conversationData.name, createObservableArray() );
        conversationData.messages.forEach( ( message: Message ) => {
          conversation.messages.push( message );
        } );
        this.conversations.push( conversation );
      } );

      // load the active conversation
      this.activateConversation( this.conversations[ this.conversations.length - 1 ] || null );
    }

    if ( this.conversations.length === 0 ) {
      // this.createNewConversation();
    }
  }

  public save() {

    // save the current messages to the active conversation before saving
    this.saveMessagesToConversation();

    // serialize the model to JSON
    const modelData = {
      conversations: this.conversations.map( conversation => { return { name: conversation.name, messages: conversation.messages }; } )
    };

    // save modelData to local storage
    const jsonString = JSON.stringify( modelData );
    localStorage.setItem( 'customChat', jsonString );
  }
}