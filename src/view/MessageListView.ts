import { DOM, Node, Rectangle } from 'phet-lib/scenery';
import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import Constants from '../Constants.ts';
import { Emitter } from 'phet-lib/axon';

export default class MessageListView extends Node {
  public readonly layoutEmitter: Emitter = new Emitter();

  constructor( model: ChatModel ) {
    super();

    // The bounds of the DOM element are behaving oddly. This rectangle will surround the element
    // for correct mouse/touch areas and layout for positioning in scenery
    const layoutRectangle = new Rectangle( 0, 0, 0, 0, { fill: 'rgba(255,255,255,0.0)' } );
    this.addChild( layoutRectangle );

    const parentElement = document.createElement( 'div' );
    parentElement.style.display = 'inline-block'; // This is necessary for scenery layout to work
    parentElement.style.height = '500px';
    parentElement.style.width = '850px';

    const parentNode = new DOM( parentElement );
    layoutRectangle.addChild( parentNode );

    // A parent for content so we can use free scrollbars
    const usableParent = document.createElement( 'div' );
    usableParent.className = 'scrollable';
    usableParent.style.height = '100%';
    usableParent.style.overflowY = 'auto';
    usableParent.style.scrollbarGutter = 'stable';
    parentElement.appendChild( usableParent );

    model.messages.addItemAddedListener( ( message: Message ) => {

      // A label that indicates who wrote the message
      const labelElement = document.createElement( 'p' );
      labelElement.textContent = message.source === 'user' ? 'You:' : 'Bot:';
      this.styleElement( labelElement );
      usableParent.appendChild( labelElement );

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

        const playButton = document.createElement( 'button' );
        playButton.textContent = '▶';
        playButton.style.backgroundColor = Constants.BACKGROUND_COLOR_LIGHTER;
        playButton.style.fontSize = '20px';
        playButton.style.cursor = 'pointer';
        playButton.style.width = '30px';
        playButton.style.height = '30px';
        playButton.style.color = Constants.TEXT_COLOR;

        // place the button below the message to the right
        playButton.style.display = 'block';
        playButton.style.margin = 'auto';
        playButton.style.marginTop = '10px';
        playButton.style.marginRight = '0px';
        playButton.style.marginBottom = '0px';
        playButton.style.marginLeft = 'auto';

        // an object with audio and contentType
        let audioData: { audio: string, contentType: string } | null = null;
        let webAudio: HTMLAudioElement | null = null;

        playButton.onclick = async () => {

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
        messageElement.appendChild( playButton );
      }

      usableParent.appendChild( messageElement );

      // scroll to the bottom of the chat
      usableParent.scrollTop = usableParent.scrollHeight;

      // Remote the message and layout listener when this message is removed from the model
      model.messages.addItemRemovedListener( removedMessage => {
        if ( removedMessage === message ) {
          usableParent.removeChild( messageElement );
          usableParent.removeChild( labelElement );
        }
      } );
    } );

    // Scenery doesn't set the correct touch areas for the element - manually update them when the DOM element resizes
    const resizeObserver = new ResizeObserver( entries => {
      const entry = entries[ 0 ];
      const { width, height } = entry.contentRect;
      layoutRectangle.setRect( 0, 0, width, height );
      this.layoutEmitter.emit();
    } );
    resizeObserver.observe( usableParent );
  }


  private splitMessageIntoBlocks( message: string ): { type: 'code' | 'message', content: string }[] {

    // Use a regex that matches the entire code block, including the language specifier, but only captures the code
    const codeBlockRegex = /```[^\n]*\n([\s\S]*?)```/g;
    const result: { type: 'code' | 'message', content: string }[] = [];
    let lastIndex = 0;

    // Find each code block and extract the content before and the code itself
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

// User
// I am building a chat bot that can display code. I want the code to look reasonably formatted in the output. For now I will just use the <pre> tag to wrap code. I can assume that the code is formatted in blocks like that declare the language like
//
// Certainly! Here is a hello world program in JavaScript:
//
// ```javascript
// console.log( 'hello!' )
// ```
//
// I hope this was helpful!
//
// Can you help me write a function that will take a message string from the chat bot and break it up into an array of content separated by these blocks? So for the above example it should return
//
// [
//   'Certainly! Here is a hello world program in Javascript',
//  'console.log( 'hello!' ),
//  'I hope this was helpful!'
// ]