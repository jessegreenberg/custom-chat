import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import StyledButton from './StyledButton.ts';
import ScrollableDOMElement from './ScrollableDOMElement.ts';

// Markdown it node module seems incompatible with vite - so we are using a cdn for now
// @ts-ignore
const markdownIt = window.markdownit();

export default class MessageListView extends ScrollableDOMElement {

  private readonly messageElements: HTMLElement[] = [];

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
      messageElement.style.marginRight = '10px';
      messageElement.style.border = '1px solid #f9f9f9';
      messageElement.style.borderRadius = '10px';
      messageElement.style.padding = '15px';
      messageElement.style.cursor = 'text';
      this.styleElement( messageElement );

      this.messageElements.push( messageElement );

      messageElement.innerHTML = markdownIt.render( message.string );

      // if the message is from the bot, add a small play button to speak it
      if ( message.source === 'bot' ) {

        const playButton = new StyledButton( {
          label: '▶',
          fontSize: '20px',
          width: '30px',
          height: '30px',
          onclick: () => {
            model.getSpeechFromServer( message.string ).then( ( data: { audio: string, contentType: string } ) => {
              const audioBlob = new Blob( [ new Uint8Array( atob( data.audio ).split( '' ).map( char => char.charCodeAt( 0 ) ) ) ], { type: data.contentType } );
              const audioUrl = URL.createObjectURL( audioBlob );
              const audio = new Audio( audioUrl );
              audio.play();
              audio.onended = () => URL.revokeObjectURL( audioUrl );
            } );
          }
        } );

        // place the button below the message to the right
        playButton.domElement.style.display = 'block';
        playButton.domElement.style.margin = 'auto';
        playButton.domElement.style.marginTop = '10px';
        playButton.domElement.style.marginRight = '0px';
        playButton.domElement.style.marginBottom = '0px';
        playButton.domElement.style.marginLeft = 'auto';

        // an object with audio and contentType
        let audioData: { audio: string, contentType: string } | null = null;
        let webAudio: HTMLAudioElement | null = null;

        playButton.domElement.onclick = async () => {

          // Only request once per message, save the result for future clicks
          if ( audioData === null ) {
            const data = await model.getSpeechFromServer( message.string );

            if ( data.audio ) {
              audioData = data;
            }
          }

          if ( audioData ) {

            // Convert the Base64 string back to an array buffer
            const audioBlob = new Blob( [ new Uint8Array( atob( audioData.audio ).split( '' ).map( char => char.charCodeAt( 0 ) ) ) ], { type: audioData.contentType } );
            const audioUrl = URL.createObjectURL( audioBlob );
            if ( webAudio ) {
              webAudio.pause();
              webAudio = null;
            }
            webAudio = new Audio( audioUrl );
            webAudio.play();

            // Revoke the object URL to free up resources after playing
            webAudio.onended = () => URL.revokeObjectURL( audioUrl );
          }
        };
        messageElement.appendChild( playButton.domElement );
      }

      this.parentElement.appendChild( messageElement );

      // scroll to the bottom of the chat
      this.parentElement.scrollTop = this.parentElement.scrollHeight;

      // Remote the message and layout listener when this message is removed from the model
      const removalListener = ( removedMessage: Message ) => {
        if ( removedMessage === message ) {
          this.parentElement.removeChild( messageElement );
          this.parentElement.removeChild( labelElement );

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

    this.messageElements.forEach( messageElement => {
      messageElement.style.width = width - Constants.UI_MARGIN * 2 + 'px';
    } );
  }
}