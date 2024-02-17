import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import StyledButton from './StyledButton.ts';
import ScrollableDOMElement from './ScrollableDOMElement.ts';

// Markdown it node module seems incompatible with vite - so we are using a cdn for now
// @ts-ignore
const markdownIt = window.markdownit();

const PADDING = 15;

export default class MessageListView extends ScrollableDOMElement {

  private readonly messageElements: HTMLElement[] = [];
  private webAudioElement: HTMLAudioElement | null = null;

  public constructor( model: ChatModel ) {
    super();

    model.messages.addItemAddedListener( ( message: Message ) => {

      // A label that indicates who wrote the message
      const labelElement = document.createElement( 'p' );
      labelElement.textContent = message.source === 'user' ? 'You:' : 'Bot:';
      this.styleElement( labelElement );
      labelElement.style.display = 'block';
      this.parentElement.appendChild( labelElement );

      // The content of the message, outlined with a boarder. A cursor to indicate it is selectable
      const messageElement = document.createElement( 'div' );
      messageElement.style.marginLeft = '10px';
      messageElement.style.marginRight = '5px';
      messageElement.style.border = '1px solid #f9f9f9';
      messageElement.style.borderRadius = '10px';
      messageElement.style.padding = `${PADDING}px`;
      messageElement.style.cursor = 'text';
      messageElement.style.fontSize = Constants.FONT.size;
      messageElement.style.fontFamily = Constants.FONT.family;
      this.styleElement( messageElement );

      this.messageElements.push( messageElement );

      messageElement.innerHTML = markdownIt.render( message.string );

      // a listener on the model messageReceivedEmitter that will emit an event whenever a new message
      // is received from the server (more specific than just adding a message to the model). We need to keep a
      // reference to this listener so that we can remove it when the message is removed from the model, but
      // it isn't always added depending on the message.
      let messageReceivedListener: null | ( ( receivedMessage: Message ) => void );

      // if the message is from the bot, add a small play button to speak it
      if ( message.source === 'bot' ) {

        // an object with audio and contentType
        let audioData: { audio: string, contentType: string } | null = null;

        const playButton = new StyledButton( {
          label: '▶',
          overflow: 'hidden',
          fontSize: '25px',
          width: '40px',
          height: '40px',
          onclick: async () => {
            audioData = await this.speakContent( playButton, audioData, message.string, model );
          }
        } );

        // place the button below the message to the right
        playButton.domElement.style.display = 'block';
        playButton.domElement.style.margin = 'auto';
        playButton.domElement.style.marginTop = '10px';
        playButton.domElement.style.marginRight = '0px';
        playButton.domElement.style.marginBottom = '0px'
        playButton.domElement.style.marginLeft = 'auto';

        messageElement.appendChild( playButton.domElement );

        messageReceivedListener = async ( receivedMessage: Message ) => {
          if ( model.automaticSpeechEnabledProperty.value && receivedMessage === message ) {
            audioData = await this.speakContent( playButton, audioData, message.string, model );
          }
        }
        model.messageReceivedEmitter.addListener( messageReceivedListener );
      }

      this.parentElement.appendChild( messageElement );

      // scroll to the bottom of the chat
      this.parentElement.scrollTop = this.parentElement.scrollHeight;

      // Remote the message and layout listener when this message is removed from the model
      const removalListener = ( removedMessage: Message ) => {
        if ( removedMessage === message ) {
          this.parentElement.removeChild( messageElement );
          this.parentElement.removeChild( labelElement );

          if ( messageReceivedListener ) {
            model.messageReceivedEmitter.removeListener( messageReceivedListener );
          }

          const index = this.messageElements.indexOf( messageElement );
          if ( index !== -1 ) {
            this.messageElements.splice( index, 1 );
          }

          model.messages.removeItemRemovedListener( removalListener );
        }
      }
      model.messages.addItemRemovedListener( removalListener );
    } );
  }

  /**
   * Style text content so that it looks nice in the chat.
   */
  private styleElement( element: HTMLElement ): void {
    element.style.color = Constants.TEXT_COLOR;
  }

  public override setLayoutWidth( width: number ) {
    super.setLayoutWidth( width );

    const usableWidth = width - PADDING * 3;
    this.messageElements.forEach( messageElement => {
      messageElement.style.minWidth = usableWidth - Constants.UI_MARGIN + 'px';

      // so that the message element can grow beyond the minimum width
      messageElement.style.display = 'inline-block';
    } );
  }

  private async speakContent( playButton: StyledButton, audioData: { audio: string, contentType: string } | null, content: string, model: ChatModel ): Promise<{ audio: string, contentType: string } | null> {

    // Only request once per message, save the result for future clicks
    if ( audioData === null ) {

      playButton.setElementEnabled( false );
      const data = await model.getSpeechFromServer( content );
      playButton.setElementEnabled( true );

      if ( data.audio ) {
        audioData = data;
      }
    }

    if ( audioData ) {

      // If the audio is already playing, pause it
      if ( this.webAudioElement ) {
        this.webAudioElement.pause();
        this.webAudioElement = null;

        playButton.setLabel( '▶' );
      }
      else {

        // Convert the Base64 string back to an array buffer
        const audioBlob = new Blob( [ new Uint8Array( atob( audioData.audio ).split( '' ).map( char => char.charCodeAt( 0 ) ) ) ], { type: audioData.contentType } );
        const audioUrl = URL.createObjectURL( audioBlob );

        this.webAudioElement = new Audio( audioUrl );
        this.webAudioElement.play();

        playButton.setLabel( '||' );

        // Revoke the object URL to free up resources after playing
        this.webAudioElement.onended = () => {
          URL.revokeObjectURL( audioUrl )
          playButton.setLabel( '▶' );

          this.webAudioElement = null;
        };
      }
    }

    return audioData;
  }
}