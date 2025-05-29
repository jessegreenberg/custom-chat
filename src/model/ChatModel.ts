import { BooleanProperty, createObservableArray, DerivedProperty, Emitter, ObservableArray, Property, StringProperty } from 'phet-lib/axon';
import Conversation from './Conversation.ts';
import Message from './Message.ts';

const windowHost = window.location.hostname;

type ServerResponse = {

  // A chat message from the server
  message: string;

  // An image string from the server, if using an image model
  imageString?: string;
}

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

  // Emits when a message is received from the server. We need to distinguish differences between
  // a message being added because we received it from the server, and a message being added because
  // of any reason (like save/load/user input).
  public readonly messageReceivedEmitter: Emitter<Message[]> = new Emitter( { parameters: [ { valueType: Message } ] } );

  // @ts-ignore - TODO: Why are all of these required in the typing?
  public readonly isWaitingForResponseProperty: DerivedProperty<boolean>;

  // Controls visibility of the settings dialog.
  public readonly settingsVisibleProperty = new BooleanProperty( false );

  // If true, speech will happen automatically as soon as the bot responds.
  public readonly automaticSpeechEnabledProperty = new BooleanProperty( false );

  // If true, speech will use the OpenAI API to generate speech - otherwise it uses built-in speech synthesis.
  public readonly useOpenAISpeechProperty = new BooleanProperty( false );

  // The model to use for the chat.
  public readonly modelProperty = new StringProperty( 'gpt-4o' );

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
  private addMessage( message: Message ): void {
    if ( !this.activeConversationProperty.value ) {
      this.createNewConversation();
    }

    this.messages.push( message );

    this.save();
  }

  /**
   * Remove a message from the chat.
   */
  public removeMessage( message: Message ): void {
    this.messages.remove( message );

    this.save();
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
  public async sendMessage( message: string, imageString?: string ): Promise<void> {
    const newMessage = new Message( message, 'user', new Date().getTime(), imageString );
    this.addMessage( newMessage );

    // Send the message to the server
    const returnResponse = await this.sendDataToServer();
    const returnMessage = returnResponse.message;
    const botMessage = new Message( returnMessage, 'bot', new Date().getTime(), returnResponse.imageString );
    this.addMessage( botMessage );

    this.messageReceivedEmitter.emit( botMessage );

    // Once we have two messages, generate a title for the conversation
    if ( this.messages.length === 2 && this.activeConversationProperty.value ) {
      this.activeConversationProperty.value.nameProperty.value = await this.summarizeForTitle();
      this.save();
    }
  }

  /**
   * Makea request with OpenAI to create a title for the conversation.
   */
  public async summarizeForTitle(): Promise<string> {
    try {
      const data = {
        messages: this.messages
      };

      const response = await fetch( `http://${windowHost}:3000/api/openai/summarizeTitle`, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data ) // convert the JavaScript object to a JSON string
      } );

      const responseData = await response.json(); // Parse the JSON response

      // if we get a 500 error, we should return an error message
      if ( response.status === 500 ) {
        return 'There was an error with the request.';
      }
      else {
        return responseData.message.content;
      }
    }
    catch( error ) {
      return 'There was an error with the request.';
    }
  }

  /**
   * Send a request to the OpenAI server.
   */
  public async sendDataToServer(): Promise<ServerResponse> {

    this.isWaitingForTextProperty.value = true;

    const data = {
      messages: this.messages,
      model: this.modelProperty.value
    };

    // Return an error message and indicate that the model is no longer waiting for this request.
    const resolveError = (): ServerResponse => {
      this.isWaitingForTextProperty.value = false;
      return {
        message: 'There was an error with the request.'
      }
    }

    // Return a success message and indicate that the model is no longer waiting for this request.
    const resolveSuccess = ( response: ServerResponse ): ServerResponse => {
      this.isWaitingForTextProperty.value = false;
      return response;
    }

    try {
      const response = await fetch( `http://${windowHost}:3000/api/openai`, {
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
        return resolveSuccess( {
          message: responseData.message.content,
          imageString: responseData.imageString
        } );
      }
    }
    catch( error ) {
      return resolveError();
    }
  }

  /**
   * Request the list of models from the server. Once requested, they are cached in local storage.
   * You can forcefully refresh if you wish.
   * @param refresh
   */
  public async fetchModels( refresh = false ): Promise<{ id: string }[]> {
    try {

      let jsonResponse = localStorage.getItem( 'models' );
      if ( refresh || jsonResponse === null ) {
        const response = await fetch( `http://${windowHost}:3000/api/openai/models` );

        if ( response.status === 500 ) {
          throw new Error( 'There was an error with the request.' );
        }

        const jsonResponse = await response.json();
        localStorage.setItem( 'models', JSON.stringify( jsonResponse ) );

        return jsonResponse;
      }
      else {
        return JSON.parse( jsonResponse );
      }
    }
    catch( error ) {
      console.error( 'Error fetching models:', error );
      return [];
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
      const response = await fetch( `http://${windowHost}:3000/api/openai/speak`, {
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

      this.useOpenAISpeechProperty.value = modelData.useOpenAISpeech || false;
      this.automaticSpeechEnabledProperty.value = modelData.automaticSpeechEnabled || false;
      this.modelProperty.value = modelData.model || 'gpt-4-0125-preview';
    }

    // Start with a new conversation if there are no conversations.
    if ( this.conversations.length === 0 ) {
      this.createNewConversation();
    }
  }

  public save() {

    // save the current messages to the active conversation before saving
    this.saveMessagesToConversation();

    // serialize the model to JSON
    const modelData = {
      conversations: this.conversations.map( conversation => conversation.save() ),
      useOpenAISpeech: this.useOpenAISpeechProperty.value,
      automaticSpeechEnabled: this.automaticSpeechEnabledProperty.value,
      model: this.modelProperty.value
    };

    // save modelData to local storage
    try {
      const jsonString = JSON.stringify( modelData );
      localStorage.setItem( 'customChat', jsonString );
    }
    catch {
      // Handle any errors that may occur during serialization or storage
      console.error( 'Error saving model data to local storage.' );
    }
  }
}