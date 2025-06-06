import Constants from '../Constants.ts';
import ChatModel from '../model/ChatModel.ts';
import Message from '../model/Message.ts';
import ScrollableDOMElement from './ScrollableDOMElement.ts';
import StyledButton from './StyledButton.ts';

// Markdown it node module seems incompatible with vite - so we are using a cdn for now
// @ts-ignore
const markdownIt = window.markdownit( { breaks: true } );

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
      labelElement.style.fontSize = Constants.FONT.size;
      labelElement.style.fontFamily = Constants.FONT.family;
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

      // The chat responds with nice markdown, so we can display it nicely with markdown-it. But we don't want
      // to do that for user content since it could be anything.
      if ( message.source === 'bot' ) {
        console.log( message.string );
        messageElement.innerHTML = markdownIt.render( message.string );
      }
      else {
        const textContentElement = document.createElement( 'p' );
        messageElement.appendChild( textContentElement );
        textContentElement.textContent = message.string;

        // so that the new lines are preserved
        textContentElement.style.whiteSpace = 'pre-line';
      }

      // if there is an image in the message, add it below the text
      if ( message.imageString ) {
        const imageElement = document.createElement( 'img' );

        // the image string is a base64 encoded string representation of the image
        imageElement.src = 'data:image/png;base64,' + message.imageString;
        // imageElement.style.width = '25%';
        // imageElement.style.height = 'auto';

        messageElement.appendChild( imageElement );
      }

      const buttonParent = document.createElement( 'div' );
      buttonParent.style.display = 'flex';
      buttonParent.style.paddingTop = '15px';

      if ( message.source === 'user' ) {

        // a delete button to the left
        const restartFromHereButton = new StyledButton( {
          label: '↺',
          overflow: 'hidden',
          fontSize: '25px',
          width: '40px',
          height: '40px',
          onclick: async () => {

            // Delete all messages below this one
            const index = model.messages.indexOf( message );
            while ( model.messages.length > index ) {
              model.removeMessage( model.messages[ model.messages.length - 1 ] );
            }

            // now send the message again to start the conversation again from here
            await model.sendMessage( message.string );
          }
        } );

        buttonParent.style.justifyContent = 'flex-start'; // so that they are on the sides
        buttonParent.appendChild( restartFromHereButton.domElement );
      }

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

        buttonParent.style.justifyContent = 'flex-end'; // so that they are on the sides
        buttonParent.appendChild( playButton.domElement );

        messageReceivedListener = async ( receivedMessage: Message ) => {
          if ( model.automaticSpeechEnabledProperty.value && receivedMessage === message ) {
            audioData = await this.speakContent( playButton, audioData, message.string, model );
          }
        }
        model.messageReceivedEmitter.addListener( messageReceivedListener );
      }

      messageElement.appendChild( buttonParent );

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

    if ( model.useOpenAISpeechProperty.value ) {

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
    }
    else {

      // Not using openai, using speechSynthesis for cheaper and faster speech
      if ( speechSynthesis.speaking ) {

        // stop any previous speech
        speechSynthesis.cancel();
        playButton.setLabel( '▶' );
      }
      else {

        // speak directly with browser speech synthesis - remove markdown from the content
        const utterance = new SpeechSynthesisUtterance( this.stripMarkdown( content ) );
        utterance.lang = 'en-US';

        // use the best voice available
        const voices = speechSynthesis.getVoices();
        const enVoices = voices.filter( voice => voice.lang === 'en-US' );

        const ariaVoice = enVoices.find( voice => voice.name.includes( 'Microsoft Michelle Online' ) );
        const onlineVoice = enVoices.find( voice => voice.name.includes( 'Online' ) );
        const googleVoice = enVoices.find( voice => voice.name.includes( 'Google' ) );
        utterance.voice = ariaVoice || onlineVoice || googleVoice || enVoices[ 0 ]; // fallback to whatever en voice is available

        // speed up the speech a bit, it sounds nicer (for best voices on Edge)
        utterance.rate = 1.3;

        speechSynthesis.speak( utterance );


        // indicate that the speech is playing
        playButton.setLabel( '||' );

        // when the speech is done, set the button back to the play icon
        utterance.onend = () => {
          playButton.setLabel( '▶' );
        };
      }
    }

    return audioData;
  }

  /**
   * Try to remove markdown from text content, so that it can be spoken better by the browser's speech synthesis.
   */
  private stripMarkdown( content: string ): string {
    const regex = /(\*\*|__)(.*?)\1|(`)(.*?)\3|(\*\*|__)(.*?)\1|#(.*?)#|\[(.*?)\]\((.*?)\)|(\*\b(.*?)\b\*)|(```)(.*?)\3/g;
    return content.replace( regex, '$2$4$6$7$9$11$13' ).replace( /\n/g, ' ' ).trim();
  }
}