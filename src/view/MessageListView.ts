import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import StyledButton from './StyledButton.ts';
import ScrollableDOMElement from './ScrollableDOMElement.ts';

export default class MessageListView extends ScrollableDOMElement {

  public constructor( model: ChatModel ) {
    super();

    model.messages.addItemAddedListener( ( message: Message ) => {

      // A label that indicates who wrote the message
      const labelElement = document.createElement( 'p' );
      labelElement.textContent = message.source === 'user' ? 'You:' : 'Bot:';
      this.styleElement( labelElement );
      this.parentElement.appendChild( labelElement );

      const messageElement = document.createElement( 'div' );
      messageElement.style.margin = '0 auto 20px';
      messageElement.style.border = '1px solid #f9f9f9';
      messageElement.style.borderRadius = '10px';
      messageElement.style.padding = '10px';
      messageElement.style.cursor = 'text';
      this.styleElement( messageElement );

      // The content of the message, outlined with a boarder. A cursor to indicate it is selectable
      const messageBlocks = this.splitMessageIntoBlocks( message.string );

      messageBlocks.map( block => {
        let element = block.type === 'code' ? document.createElement( 'pre' ) : document.createElement( 'p' );

        element.style.color = block.type === 'code' ? Constants.TEXT_COLOR_DARKER : Constants.TEXT_COLOR;

        element.textContent = block.content;
        element.style.marginTop = '0';
        messageElement.appendChild( element );
      } );

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

          model.messages.removeItemRemovedListener( removalListener );
        }
      }
      model.messages.addItemRemovedListener( removalListener );
    } );
  }


  private splitMessageIntoBlocks( message: string ): { type: 'code' | 'message', content: string }[] {

    // Use a regex that matches the entire code block, including the language specifier, but only captures the code
    const codeBlockRegex = /```[^\n]*\n([\s\S]*?)```/g;
    const result: { type: 'code' | 'message', content: string }[] = [];
    let lastIndex = 0;

    // Find each code block and extract the content before and the code itself
    // @ts-ignore
    message.replace( codeBlockRegex, ( match, code, index ) => {
      // Add the text before the code block, if any
      if ( index > lastIndex ) {
        const content = message.substring( lastIndex, index ).trim();
        if ( content.length > 0 ) {
          result.push( { type: 'message', content: content } );
        }
      }

      // Add the code block itself, without the language specifier
      result.push( { type: 'code', content: code.trim() } );
      lastIndex = index + match.length;
    } );

    // Add any remaining text after the last code block
    if ( lastIndex < message.length ) {
      const content = message.substring( lastIndex ).trim();
      if ( content.length > 0 ) {
        result.push( { type: 'message', content: content } );
      }
    }

    return result;
  }

  /**
   * Style text content so that it looks nice in the chat.
   */
  private styleElement( element: HTMLElement ): void {
    element.style.fontSize = Constants.FONT.size;
    element.style.fontFamily = Constants.FONT.family;
    element.style.color = Constants.TEXT_COLOR;
    element.style.display = 'inline-block';
    element.style.width = '800px';
    element.style.whiteSpace = 'pre-wrap'; // to preserve new-lines
  }
}